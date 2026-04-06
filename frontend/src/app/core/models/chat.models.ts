export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  rows?: Record<string, unknown>[];
  createdAt: string;
  loading?: boolean;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  sql?: string;
  rows?: Record<string, unknown>[];
}
