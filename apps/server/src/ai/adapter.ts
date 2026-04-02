import type {
  DefaultMessageMetadataByModality,
  ModelMessage,
  StreamChunk,
  TextOptions,
  Tool,
  ToolCall,
} from '@tanstack/ai';
import {
  BaseTextAdapter,
  type StructuredOutputOptions,
  type StructuredOutputResult,
  type TextAdapterConfig,
} from '@tanstack/ai/adapters';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { env } from '../env';

// ---------------------------------------------------------------------------
// NVIDIA NIM adapter — Chat Completions API
// ---------------------------------------------------------------------------
// The official @tanstack/ai-openai adapter (v0.7+) targets OpenAI's Responses
// API (/v1/responses). NVIDIA NIM only exposes the Chat Completions endpoint
// (/v1/chat/completions), so we extend BaseTextAdapter directly.
// ---------------------------------------------------------------------------

/** Provider options forwarded to the NVIDIA API. */
interface NvidiaProviderOptions {
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

/** NVIDIA only accepts text input. */
type NvidiaInputModalities = readonly ['text'];

/**
 * Concrete text adapter that calls any OpenAI-compatible Chat Completions API.
 */
class NvidiaChatAdapter<TModel extends string> extends BaseTextAdapter<
  TModel,
  NvidiaProviderOptions,
  NvidiaInputModalities,
  DefaultMessageMetadataByModality
> {
  readonly name = 'nvidia' as const;
  private client: OpenAI;

  constructor(config: TextAdapterConfig, model: TModel, client: OpenAI) {
    super(config, model);
    this.client = client;
  }

  // -------------------------------------------------------------------------
  // chatStream — streaming Chat Completions
  // -------------------------------------------------------------------------
  async *chatStream(options: TextOptions<NvidiaProviderOptions>): AsyncIterable<StreamChunk> {
    const runId = this.generateId();
    const messageId = this.generateId();
    const timestamp = Date.now();

    const toolCallBuffers = new Map<
      number,
      { id: string; name: string; args: string; emitted: boolean }
    >();

    const response = await this.client.chat.completions.create(
      {
        model: options.model,
        messages: [
          ...toSystemMessages(options.systemPrompts),
          ...toOpenAIMessages(options.messages),
        ],
        ...toOpenAITools(options.tools),
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.8,
        max_tokens: options.maxTokens ?? 16_384,
        ...options.modelOptions,
        stream: true,
      },
      { signal: options.request?.signal as AbortSignal | undefined },
    );

    let ranStarted = false;
    let textStarted = false;
    let accumulated = '';

    for await (const chunk of response) {
      // -- RUN_STARTED (once) ---
      if (!ranStarted) {
        ranStarted = true;
        yield { type: 'RUN_STARTED', runId, model: chunk.model, timestamp };
      }

      const choice = chunk.choices[0];
      if (!choice) continue;
      const { delta, finish_reason } = choice;

      // -- text deltas ---
      if (delta.content) {
        if (!textStarted) {
          textStarted = true;
          yield {
            type: 'TEXT_MESSAGE_START',
            messageId,
            model: chunk.model,
            timestamp,
            role: 'assistant',
          };
        }
        accumulated += delta.content;
        yield {
          type: 'TEXT_MESSAGE_CONTENT',
          messageId,
          model: chunk.model,
          timestamp,
          delta: delta.content,
          content: accumulated,
        };
      }

      // -- tool-call deltas (accumulated until finish) ---
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          let buf = toolCallBuffers.get(idx);
          if (!buf) {
            buf = { id: tc.id ?? this.generateId(), name: '', args: '', emitted: false };
            toolCallBuffers.set(idx, buf);
          }
          if (tc.id) buf.id = tc.id;
          if (tc.function?.name) buf.name += tc.function.name;
          if (tc.function?.arguments) buf.args += tc.function.arguments;
        }
      }

      // -- finish ---
      if (finish_reason) {
        // Flush tool calls
        for (const [, buf] of toolCallBuffers) {
          yield {
            type: 'TOOL_CALL_START',
            toolCallId: buf.id,
            toolName: buf.name,
            model: chunk.model,
            timestamp,
          };

          let parsedInput: unknown;
          try {
            parsedInput = JSON.parse(buf.args);
          } catch {
            parsedInput = buf.args;
          }

          yield {
            type: 'TOOL_CALL_END',
            toolCallId: buf.id,
            toolName: buf.name,
            model: chunk.model,
            timestamp,
            input: parsedInput,
          };
        }

        if (textStarted) {
          yield { type: 'TEXT_MESSAGE_END', messageId, model: chunk.model, timestamp };
        }

        yield {
          type: 'RUN_FINISHED',
          runId,
          model: chunk.model,
          timestamp,
          finishReason: toolCallBuffers.size > 0 ? 'tool_calls' : 'stop',
        };
      }
    }
  }

  // -------------------------------------------------------------------------
  // structuredOutput — non-streaming JSON mode
  // -------------------------------------------------------------------------
  async structuredOutput(
    options: StructuredOutputOptions<NvidiaProviderOptions>,
  ): Promise<StructuredOutputResult<unknown>> {
    const { chatOptions } = options;

    const response = await this.client.chat.completions.create({
      model: chatOptions.model,
      messages: [
        ...toSystemMessages(chatOptions.systemPrompts),
        ...toOpenAIMessages(chatOptions.messages),
      ],
      ...toOpenAITools(chatOptions.tools),
      temperature: chatOptions.temperature,
      response_format: { type: 'json_object' },
      stream: false,
    });

    const rawText = response.choices[0]?.message?.content ?? '{}';
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Failed to parse structured output as JSON: ${rawText.slice(0, 200)}`);
    }
    return { data, rawText };
  }
}

// ---------------------------------------------------------------------------
// Message & tool conversion helpers
// ---------------------------------------------------------------------------

function toSystemMessages(prompts?: ReadonlyArray<string>): ChatCompletionMessageParam[] {
  if (!prompts?.length) return [];
  return prompts.map(content => ({ role: 'system' as const, content }));
}

function extractText(content: ModelMessage['content']): string {
  if (content === null) return '';
  if (typeof content === 'string') return content;
  return content
    .filter(p => p.type === 'text')
    .map(p => ('content' in p ? (p.content as string) : ''))
    .join('');
}

function toOpenAIMessages(messages: ReadonlyArray<ModelMessage>): ChatCompletionMessageParam[] {
  return messages.map((msg): ChatCompletionMessageParam => {
    const text = extractText(msg.content);

    if (msg.role === 'tool' && msg.toolCallId) {
      return { role: 'tool', content: text, tool_call_id: msg.toolCallId };
    }

    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      return {
        role: 'assistant',
        content: text || null,
        tool_calls: msg.toolCalls.map((tc: ToolCall) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      };
    }

    if (msg.role === 'assistant') {
      return { role: 'assistant', content: text };
    }

    return { role: 'user', content: text };
  });
}

function toOpenAITools(
  tools?: ReadonlyArray<Tool>,
): { tools: ChatCompletionTool[] } | Record<string, never> {
  if (!tools?.length) return {};
  return {
    tools: tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: (t.inputSchema ?? {
          type: 'object',
          properties: {},
          required: [],
        }) as Record<string, unknown>,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// Exported adapter instance
// ---------------------------------------------------------------------------

export const nvidiaAdapter = new NvidiaChatAdapter(
  {},
  'qwen/qwen3.5-397b-a17b',
  new OpenAI({
    apiKey: env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  }),
);
