import { ollamaText } from '@tanstack/ai-ollama';

// TODO: Adjust model name based on what you have installed in Ollama
// Good choices for tool calling: llama3.2, qwen2.5, mistral
// Run `ollama list` to see available models
// If the base URL is not http://localhost:11434, pass it as a second arg:
//   ollamaText('llama3.2', { baseUrl: 'http://...' })
export const ollamaAdapter = ollamaText('qwen2.5:7b');
