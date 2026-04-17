import { describe, expect, it, vi } from 'vitest';

vi.mock('../env', () => ({
  env: {
    NVIDIA_API_KEY: 'test-nvidia-key',
  },
}));

const chatMock = vi.fn().mockReturnValue('chat-model-instance');
const createOpenAIMock = vi.fn().mockReturnValue(Object.assign(vi.fn(), { chat: chatMock }));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: createOpenAIMock,
}));

const wrapLanguageModelMock = vi.fn().mockReturnValue('wrapped-model-instance');

const extractReasoningMiddlewareMock = vi.fn().mockReturnValue('reasoning-middleware');

vi.mock('ai', () => ({
  extractReasoningMiddleware: extractReasoningMiddlewareMock,
  wrapLanguageModel: wrapLanguageModelMock,
}));

vi.mock('@ai-sdk/devtools', () => ({
  devToolsMiddleware: vi.fn().mockReturnValue('devtools-middleware'),
}));

describe('nvidiaModel', () => {
  it('creates an OpenAI-compatible provider with devtools middleware', async () => {
    const { nvidiaModel } = await import('./adapter');

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: 'test-nvidia-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
      name: 'nvidia',
    });
    expect(chatMock).toHaveBeenCalledWith('mistralai/mistral-small-4-119b-2603');
    expect(extractReasoningMiddlewareMock).toHaveBeenCalledWith({ tagName: 'think' });
    expect(wrapLanguageModelMock).toHaveBeenCalledWith({
      model: 'chat-model-instance',
      middleware: ['reasoning-middleware'],
    });
    expect(nvidiaModel).toBe('wrapped-model-instance');
  });
});
