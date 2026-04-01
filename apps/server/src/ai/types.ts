export interface ChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  message: string;
  usedTool: string | null;
  toolResult: unknown;
}
