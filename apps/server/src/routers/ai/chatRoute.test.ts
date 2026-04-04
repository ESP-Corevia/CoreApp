import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const chatMock = vi.fn();
const maxIterationsMock = vi.fn();
const toServerSentEventsStreamMock = vi.fn();
const fromNodeHeadersMock = vi.fn();
const createAICallerMock = vi.fn();
const getToolsForRoleMock = vi.fn();
const getSystemPromptForRoleMock = vi.fn();

const aiLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
};

vi.mock('@tanstack/ai', () => ({
  chat: chatMock,
  maxIterations: maxIterationsMock,
  toServerSentEventsStream: toServerSentEventsStreamMock,
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: fromNodeHeadersMock,
}));

vi.mock('../../ai/adapter', () => ({
  nvidiaAdapter: { name: 'nvidia-adapter' },
}));

vi.mock('../../ai/caller', () => ({
  createAICaller: createAICallerMock,
}));

vi.mock('../../ai/logger', () => ({
  aiLogger,
}));

vi.mock('../../ai/tools/registry', () => ({
  getToolsForRole: getToolsForRoleMock,
  getSystemPromptForRole: getSystemPromptForRoleMock,
}));

function createSSEStream() {
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode('data: ok\n\n'));
      controller.close();
    },
  });
}

describe('chatRoutePlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maxIterationsMock.mockReturnValue('loop-strategy');
    fromNodeHeadersMock.mockImplementation(() => new Headers([['x-test', '1']]));
    getSystemPromptForRoleMock.mockReturnValue('system prompt');
    getToolsForRoleMock.mockReturnValue([
      { name: 'list_users' },
      { name: 'ban_user' },
    ]);
    toServerSentEventsStreamMock.mockImplementation((stream: AsyncIterable<unknown>) => {
      return new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(
              new TextEncoder().encode(`data:${JSON.stringify(chunk)}\n\n`),
            );
          }
          controller.close();
        },
      });
    });
  });

  it('returns 401 when there is no active session', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    };

    chatRoutePlugin(app, { auth, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Unauthorized' });
    expect(chatMock).not.toHaveBeenCalled();
  });

  it('returns 400 when messages are missing', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({ userId: 'user-1', role: 'admin' }),
      },
    };

    chatRoutePlugin(app, { auth, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [] },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'messages is required' });
    expect(chatMock).not.toHaveBeenCalled();
  });

  it('streams chat events, logs them, and defaults missing roles to patient', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const caller = { admin: {} };
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({ userId: 'user-1' }),
      },
    };

    createAICallerMock.mockReturnValue(caller);
    chatMock.mockReturnValue(
      (async function* () {
        yield { type: 'RUN_STARTED', model: 'nim', runId: 'run-1' };
        yield { type: 'TOOL_CALL_START', toolName: 'list_users', toolCallId: 'tool-1' };
        yield {
          type: 'TOOL_CALL_END',
          toolName: 'list_users',
          toolCallId: 'tool-1',
          input: { page: 1 },
        };
        yield {
          type: 'TOOL_CALL_END',
          toolName: 'list_users',
          toolCallId: 'tool-1',
          result: { items: [] },
        };
        yield { type: 'TEXT_MESSAGE_CONTENT', content: 'Bonjour' };
        yield { type: 'RUN_FINISHED', finishReason: 'stop' };
      })(),
    );

    chatRoutePlugin(app, { auth, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [
          { role: 'user', content: 'hello' },
          {
            role: 'user',
            parts: [
              { type: 'text', content: 'how ' },
              { type: 'image', content: 'ignored' },
              { type: 'text', content: 'are you?' },
            ],
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers.connection).toBe('keep-alive');

    expect(createAICallerMock).toHaveBeenCalledOnce();
    expect(getToolsForRoleMock).toHaveBeenCalledWith(
      'patient',
      expect.objectContaining({
        caller,
        auth,
      }),
    );
    expect(getSystemPromptForRoleMock).toHaveBeenCalledWith('patient');
    expect(maxIterationsMock).toHaveBeenCalledWith(5);
    expect(chatMock).toHaveBeenCalledWith({
      adapter: { name: 'nvidia-adapter' },
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'user', content: 'how are you?' },
      ],
      tools: [
        { name: 'list_users' },
        { name: 'ban_user' },
      ],
      systemPrompts: ['system prompt'],
      temperature: 0.7,
      agentLoopStrategy: 'loop-strategy',
      abortController: expect.any(AbortController),
      middleware: [],
    });
    expect(toServerSentEventsStreamMock).toHaveBeenCalledOnce();
    expect(aiLogger.info).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        reqId: expect.any(String),
        userId: 'user-1',
        role: 'patient',
        tools: ['list_users', 'ban_user'],
        messageCount: 2,
      }),
      '[ai:chat] new request — role=%s tools=%j',
      'patient',
      ['list_users', 'ban_user'],
    );
    expect(aiLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'nim', runId: 'run-1' }),
      '[ai:run] started',
    );
    expect(aiLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ tool: 'list_users', toolCallId: 'tool-1' }),
      '[ai:tool] calling %s',
      'list_users',
    );
    expect(aiLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ tool: 'list_users', input: { page: 1 } }),
      '[ai:tool] %s dispatched',
      'list_users',
    );
    expect(aiLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: 'list_users',
        toolCallId: 'tool-1',
        resultPreview: '{"items":[]}',
      }),
      '[ai:tool] %s returned',
      'list_users',
    );
    expect(aiLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ reqId: expect.any(String) }),
      '[ai:text] chunk',
    );
    expect(aiLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ finishReason: 'stop', durationMs: expect.any(Number) }),
      '[ai:run] finished (%s) in %dms',
      'stop',
      expect.any(Number),
    );
  });

  it('returns 500 when chat setup throws', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({ userId: 'user-1', role: 'admin' }),
      },
    };

    createAICallerMock.mockReturnValue({ admin: {} });
    chatMock.mockImplementation(() => {
      throw new Error('boom');
    });

    chatRoutePlugin(app, { auth, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: 'AI chat failed',
      details: 'boom',
    });
    expect(aiLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        reqId: expect.any(String),
        err: expect.any(Error),
      }),
      '[ai:chat] failed',
    );
  });
});
