import { Readable } from 'node:stream';
import { chat, maxIterations, toServerSentEventsStream } from '@tanstack/ai';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Services } from '../db/services';
import type { auth as Auth } from '../lib/auth';
import { createAICaller } from './createCaller';
import { aiLogger } from './logger';
import { ollamaAdapter } from './ollama';
import { getSystemPromptForRole, getToolsForRole } from './tools/registry';

interface ChatBody {
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; content: string }> }>;
}

/**
 * Wraps a TanStack AI stream to log events without consuming it.
 * Yields every chunk through, logging tool calls and run lifecycle.
 */
async function* withLogging(
  stream: AsyncIterable<Record<string, unknown>>,
  reqId: string,
) {
  const startTime = Date.now();

  for await (const chunk of stream) {
    const c = chunk as Record<string, unknown>;

    switch (c.type) {
      case 'RUN_STARTED':
        aiLogger.info({ reqId, model: c.model, runId: c.runId }, '[ai:run] started');
        break;
      case 'TOOL_CALL_START':
        aiLogger.info(
          { reqId, tool: c.toolName, toolCallId: c.toolCallId },
          '[ai:tool] calling %s',
          c.toolName,
        );
        break;
      case 'TOOL_CALL_END':
        if (c.result !== undefined) {
          const preview =
            typeof c.result === 'string'
              ? c.result.slice(0, 200) + (c.result.length > 200 ? '...' : '')
              : JSON.stringify(c.result).slice(0, 200);
          aiLogger.info(
            { reqId, tool: c.toolName, toolCallId: c.toolCallId, resultPreview: preview },
            '[ai:tool] %s returned',
            c.toolName,
          );
        } else {
          aiLogger.debug(
            { reqId, tool: c.toolName, input: c.input },
            '[ai:tool] %s dispatched',
            c.toolName,
          );
        }
        break;
      case 'RUN_FINISHED':
        aiLogger.info(
          { reqId, finishReason: c.finishReason, durationMs: Date.now() - startTime },
          '[ai:run] finished (%s) in %dms',
          c.finishReason,
          Date.now() - startTime,
        );
        break;
      case 'TEXT_MESSAGE_CONTENT':
        // Too noisy at info — log at debug
        aiLogger.debug({ reqId }, '[ai:text] chunk');
        break;
    }

    yield chunk;
  }
}

export function createChatHandler({
  auth,
  services,
}: {
  auth: typeof Auth;
  services: Services;
}) {
  return async (req: FastifyRequest<{ Body: ChatBody }>, res: FastifyReply) => {
    const reqId = req.id;

    // 1. Resolve session from Better Auth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { messages: rawMessages } = req.body;

    if (!rawMessages?.length) {
      return res.status(400).send({ error: 'messages is required' });
    }

    // 2. Normalize messages — useChat may send parts-based or content-based
    const messages = rawMessages.map((m) => {
      const content =
        m.content ??
        m.parts
          ?.filter((p) => p.type === 'text')
          .map((p) => p.content)
          .join('') ??
        '';
      return { role: m.role as 'user' | 'assistant', content };
    });

    // 3. Create server-side tRPC caller with the real session context
    const caller = createAICaller({ session, req, res, auth, services });

    // 4. Get role-based tools and system prompt
    const role = (session as { role?: string }).role ?? 'patient';
    const tools = getToolsForRole(role, caller);
    const toolNames = tools.map((t) => (t as { name?: string }).name ?? 'unknown');
    const systemPrompt = getSystemPromptForRole(role);

    aiLogger.info(
      { reqId, userId: session.userId, role, tools: toolNames, messageCount: messages.length },
      '[ai:chat] new request — role=%s tools=%j',
      role,
      toolNames,
    );

    try {
      const abortController = new AbortController();

      // 5. Call TanStack AI chat with Ollama + role-based tools
      const stream = chat({
        adapter: ollamaAdapter,
        messages,
        tools,
        systemPrompts: [systemPrompt],
        agentLoopStrategy: maxIterations(2),
        abortController,
      });

      // 6. Wrap with logging, convert to SSE, stream to client
      const logged = withLogging(stream as AsyncIterable<Record<string, unknown>>, reqId);
      const sseStream = toServerSentEventsStream(logged as never, abortController);
      const nodeStream = Readable.fromWeb(sseStream as never);

      req.raw.on('close', () => {
        aiLogger.debug({ reqId }, '[ai:chat] client disconnected');
        abortController.abort();
      });

      return res
        .type('text/event-stream')
        .header('Cache-Control', 'no-cache')
        .header('Connection', 'keep-alive')
        .send(nodeStream);
    } catch (error) {
      aiLogger.error({ reqId, err: error }, '[ai:chat] failed');
      return res.status(500).send({
        error: 'AI chat failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
