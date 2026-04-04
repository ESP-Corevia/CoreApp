import { createOpenAI } from '@ai-sdk/openai';
import { env } from '../env';

// ---------------------------------------------------------------------------
// NVIDIA NIM provider — OpenAI-compatible Chat Completions API
// ---------------------------------------------------------------------------
// Uses @ai-sdk/openai with a custom baseURL pointing to NVIDIA's endpoint.
// ---------------------------------------------------------------------------

const nvidia = createOpenAI({
  apiKey: env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  name: 'nvidia',
});

// NVIDIA NIM only supports Chat Completions (/v1/chat/completions), not the
// OpenAI Responses API (/v1/responses) which is the default since AI SDK 5.
// Use .chat() to explicitly select the Chat Completions endpoint.
export const nvidiaModel: ReturnType<typeof nvidia.chat> = nvidia.chat('qwen/qwen3.5-397b-a17b');
