import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
const instances: Array<{ config: Record<string, unknown> }> = [];

vi.mock('../env', () => ({
  env: {
    NVIDIA_API_KEY: 'test-nvidia-key',
  },
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    config: Record<string, unknown>;
    chat = {
      completions: {
        create: createMock,
      },
    };

    constructor(config: Record<string, unknown>) {
      this.config = config;
      instances.push(this);
    }
  },
}));

async function collect<T>(iterable: AsyncIterable<T>) {
  const items: T[] = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
}

describe('nvidiaAdapter', () => {
  beforeEach(() => {
    createMock.mockReset();
    instances.length = 0;
  });

  it('initializes OpenAI with the NVIDIA base URL and API key', async () => {
    await import('./adapter');

    expect(instances).toHaveLength(1);
    expect(instances[0]?.config).toMatchObject({
      apiKey: 'test-nvidia-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  });

  it('streams text responses and converts messages and tools to the OpenAI payload', async () => {
    createMock.mockResolvedValueOnce(
      (async function* () {
        yield {
          model: 'nim-model',
          choices: [{ delta: { content: 'Hello' }, finish_reason: null }],
        };
        yield {
          model: 'nim-model',
          choices: [{ delta: { content: ' world' }, finish_reason: 'stop' }],
        };
      })(),
    );

    const { nvidiaAdapter } = await import('./adapter');

    const events = await collect(
      nvidiaAdapter.chatStream({
        model: 'test-model',
        systemPrompts: ['Follow the rules'],
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Existing answer' },
          {
            role: 'assistant',
            content: 'Used a tool',
            toolCalls: [
              {
                id: 'call-1',
                type: 'function',
                function: {
                  name: 'lookup_user',
                  arguments: '{"id":"user-1"}',
                },
              },
            ],
          },
          { role: 'tool', content: 'Tool result', toolCallId: 'call-1' },
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Second' },
              { type: 'image', image: 'ignored' },
              { type: 'text', content: ' message' },
            ],
          } as never,
          { role: 'assistant', content: null as never },
        ],
        tools: [
          {
            name: 'lookup_user',
            description: 'Look up a user',
            inputSchema: {
              type: 'object',
              properties: { id: { type: 'string' } },
              required: ['id'],
            },
          },
        ],
        modelOptions: { presence_penalty: 0.1 },
        temperature: 0.5,
        topP: 0.9,
        maxTokens: 256,
      }),
    );

    expect(events.map(event => event.type)).toEqual([
      'RUN_STARTED',
      'TEXT_MESSAGE_START',
      'TEXT_MESSAGE_CONTENT',
      'TEXT_MESSAGE_CONTENT',
      'TEXT_MESSAGE_END',
      'RUN_FINISHED',
    ]);

    expect(events[2]).toMatchObject({
      type: 'TEXT_MESSAGE_CONTENT',
      delta: 'Hello',
      content: 'Hello',
    });
    expect(events[3]).toMatchObject({
      type: 'TEXT_MESSAGE_CONTENT',
      delta: ' world',
      content: 'Hello world',
    });
    expect(events[5]).toMatchObject({
      type: 'RUN_FINISHED',
      finishReason: 'stop',
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'test-model',
        stream: true,
        temperature: 0.5,
        top_p: 0.9,
        max_tokens: 256,
        presence_penalty: 0.1,
        messages: [
          { role: 'system', content: 'Follow the rules' },
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Existing answer' },
          {
            role: 'assistant',
            content: 'Used a tool',
            tool_calls: [
              {
                id: 'call-1',
                type: 'function',
                function: {
                  name: 'lookup_user',
                  arguments: '{"id":"user-1"}',
                },
              },
            ],
          },
          { role: 'tool', content: 'Tool result', tool_call_id: 'call-1' },
          { role: 'user', content: 'Second message' },
          { role: 'assistant', content: '' },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'lookup_user',
              description: 'Look up a user',
              parameters: {
                type: 'object',
                properties: { id: { type: 'string' } },
                required: ['id'],
              },
            },
          },
        ],
      }),
      { signal: undefined },
    );
  });

  it('flushes tool calls and parses JSON tool input at finish', async () => {
    createMock.mockResolvedValueOnce(
      (async function* () {
        yield {
          model: 'nim-model',
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: 'tool-1',
                    function: { name: 'lookup_user', arguments: '{"id":' },
                  },
                ],
              },
              finish_reason: null,
            },
          ],
        };
        yield {
          model: 'nim-model',
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    function: { arguments: '"user-2"}' },
                  },
                ],
              },
              finish_reason: 'tool_calls',
            },
          ],
        };
      })(),
    );

    const { nvidiaAdapter } = await import('./adapter');

    const events = await collect(
      nvidiaAdapter.chatStream({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Lookup me' }],
      }),
    );

    expect(events.map(event => event.type)).toEqual([
      'RUN_STARTED',
      'TOOL_CALL_START',
      'TOOL_CALL_END',
      'RUN_FINISHED',
    ]);

    expect(events[1]).toMatchObject({
      type: 'TOOL_CALL_START',
      toolCallId: 'tool-1',
      toolName: 'lookup_user',
    });
    expect(events[2]).toMatchObject({
      type: 'TOOL_CALL_END',
      toolCallId: 'tool-1',
      toolName: 'lookup_user',
      input: { id: 'user-2' },
    });
    expect(events[3]).toMatchObject({
      type: 'RUN_FINISHED',
      finishReason: 'tool_calls',
    });
  });

  it('returns parsed structured output and throws when the model response is not valid JSON', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: '{"ok":true}' } }],
    });

    const { nvidiaAdapter } = await import('./adapter');

    await expect(
      nvidiaAdapter.structuredOutput({
        outputSchema: { type: 'object' },
        chatOptions: {
          model: 'test-model',
          systemPrompts: ['json only'],
          messages: [{ role: 'user', content: 'Return JSON' }],
          tools: [],
          temperature: 0,
        },
      }),
    ).resolves.toEqual({
      data: { ok: true },
      rawText: '{"ok":true}',
    });

    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'not-json' } }],
    });

    await expect(
      nvidiaAdapter.structuredOutput({
        outputSchema: { type: 'object' },
        chatOptions: {
          model: 'test-model',
          messages: [{ role: 'user', content: 'Break JSON' }],
        },
      }),
    ).rejects.toThrow('Failed to parse structured output as JSON');
  });
});
