import { Readable } from 'node:stream';
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { nvidiaModel } from '../../ai/adapter';
import { createAICaller } from '../../ai/caller';
import { aiLogger } from '../../ai/logger';
import { getSystemPromptForRole, getToolsForRole } from '../../ai/tools/registry';
import type { Services } from '../../db/services';
import type { auth as Auth } from '../../lib/auth';

interface ChatBody {
  messages: UIMessage[];
}

export function chatRoutePlugin(
  fastify: FastifyInstance,
  { auth, services }: { auth: typeof Auth; services: Services },
  done: () => void,
) {
  fastify.post('/chat', async (req: FastifyRequest<{ Body: ChatBody }>, res: FastifyReply) => {
    const reqId = req.id;

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

    const caller = createAICaller({ session, req, res, auth, services });
    const role = session.role ?? 'patient';
    const headers = fromNodeHeaders(req.headers);
    const tools = getToolsForRole(role, { caller, auth, headers });
    const toolNames = Object.keys(tools);
    const systemPrompt = getSystemPromptForRole(role);

    aiLogger.info(
      { reqId, userId: session.userId, role, tools: toolNames, messageCount: rawMessages.length },
      '[ai:chat] new request — role=%s tools=%j',
      role,
      toolNames,
    );

    try {
      const abortController = new AbortController();

      req.raw.on('close', () => {
        aiLogger.debug({ reqId }, '[ai:chat] client disconnected');
        abortController.abort();
      });

      const startTime = Date.now();

      const result = streamText({
        model: nvidiaModel,
        system: systemPrompt,
        messages: await convertToModelMessages(rawMessages),
        tools,
        temperature: 0.7,
        stopWhen: stepCountIs(5),
        abortSignal: abortController.signal,
        onStepFinish: step => {
          if (step.toolCalls?.length) {
            for (const tc of step.toolCalls) {
              aiLogger.info(
                { reqId, tool: tc.toolName, toolCallId: tc.toolCallId },
                '[ai:tool] called %s',
                tc.toolName,
              );
            }
          }
          if (step.toolResults?.length) {
            for (const tr of step.toolResults) {
              const preview = JSON.stringify(tr.output).slice(0, 200);
              aiLogger.info(
                { reqId, tool: tr.toolName, toolCallId: tr.toolCallId, resultPreview: preview },
                '[ai:tool] %s returned',
                tr.toolName,
              );
            }
          }
        },
        onFinish: result => {
          aiLogger.info(
            {
              reqId,
              finishReason: result.finishReason,
              durationMs: Date.now() - startTime,
              steps: result.steps.length,
            },
            '[ai:run] finished (%s) in %dms',
            result.finishReason,
            Date.now() - startTime,
          );
        },
      });

      const response = result.toUIMessageStreamResponse({
        onError: error => {
          aiLogger.error({ reqId, err: error }, '[ai:tool] execution error');
          return error instanceof Error ? error.message : String(error);
        },
      });
      const nodeStream = Readable.fromWeb(response.body as never);

      return res
        .status(response.status)
        .header('Content-Type', response.headers.get('Content-Type') ?? 'text/plain')
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
  });

  done();
}
