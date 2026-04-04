import { describe, expect, it, vi } from 'vitest';

vi.mock('../env', () => ({
  env: {
    NVIDIA_API_KEY: 'test-nvidia-key',
  },
}));

const chatMock = vi.fn().mockReturnValue('chat-model-instance');
const createOpenAIMock = vi.fn().mockReturnValue(
  Object.assign(vi.fn(), { chat: chatMock }),
);

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: createOpenAIMock,
}));

describe('nvidiaModel', () => {
  it('creates an OpenAI-compatible provider targeting the Chat Completions API', async () => {
    const { nvidiaModel } = await import('./adapter');

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: 'test-nvidia-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
      name: 'nvidia',
    });
    expect(chatMock).toHaveBeenCalledWith('qwen/qwen3.5-397b-a17b');
    expect(nvidiaModel).toBe('chat-model-instance');
  });
});
