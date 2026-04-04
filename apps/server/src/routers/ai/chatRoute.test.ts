import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const streamTextMock = vi.fn();
const convertToModelMessagesMock = vi.fn();
const stepCountIsMock = vi.fn();
const fromNodeHeadersMock = vi.fn();
const createAICallerMock = vi.fn();
const getToolsForRoleMock = vi.fn();
const getSystemPromptForRoleMock = vi.fn();

const aiLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
};

vi.mock('ai', () => ({
  streamText: streamTextMock,
  convertToModelMessages: convertToModelMessagesMock,
  stepCountIs: stepCountIsMock,
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: fromNodeHeadersMock,
}));

vi.mock('../../ai/adapter', () => ({
  nvidiaModel: 'nvidia-model-instance',
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

function createMockStreamResult() {
  return {
    toUIMessageStreamResponse: () =>
      new Response('data: ok\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/x-ui-message-stream-part' },
      }),
  };
}

describe('chatRoutePlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepCountIsMock.mockReturnValue('step-count-5');
    fromNodeHeadersMock.mockImplementation(() => new Headers([['x-test', '1']]));
    getSystemPromptForRoleMock.mockReturnValue('system prompt');
    getToolsForRoleMock.mockReturnValue({
      list_users: { execute: vi.fn() },
      ban_user: { execute: vi.fn() },
    });
    convertToModelMessagesMock.mockResolvedValue([{ role: 'user', content: 'hello' }]);
  });

  it('returns 401 when there is no active session', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    };

    chatRoutePlugin(app, { auth: auth as never, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }] },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Unauthorized' });
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it('returns 400 when messages are missing', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({ userId: 'user-1', role: 'admin' }),
      },
    };

    chatRoutePlugin(app, { auth: auth as never, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [] },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'messages is required' });
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it('streams chat via Vercel AI SDK and defaults missing roles to patient', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const caller = { admin: {} };
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({ userId: 'user-1' }),
      },
    };

    createAICallerMock.mockReturnValue(caller);
    streamTextMock.mockReturnValue(createMockStreamResult());

    chatRoutePlugin(app, { auth: auth as never, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        messages: [
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] },
          { id: '2', role: 'user', parts: [{ type: 'text', text: 'how are you?' }] },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/x-ui-message-stream-part');
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
    expect(stepCountIsMock).toHaveBeenCalledWith(5);
    expect(convertToModelMessagesMock).toHaveBeenCalledOnce();
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'nvidia-model-instance',
        system: 'system prompt',
        tools: {
          list_users: expect.any(Object),
          ban_user: expect.any(Object),
        },
        temperature: 0.7,
        stopWhen: 'step-count-5',
        abortSignal: expect.any(AbortSignal),
      }),
    );

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
  });

  it('returns 500 when streamText throws', async () => {
    const { chatRoutePlugin } = await import('./chatRoute');
    const app = Fastify();
    const auth = {
      api: {
        getSession: vi.fn().mockResolvedValue({ userId: 'user-1', role: 'admin' }),
      },
    };

    createAICallerMock.mockReturnValue({ admin: {} });
    streamTextMock.mockImplementation(() => {
      throw new Error('boom');
    });

    chatRoutePlugin(app, { auth: auth as never, services: {} as never }, () => {});

    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }] },
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
