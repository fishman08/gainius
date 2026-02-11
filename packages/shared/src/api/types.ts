export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: ClaudeMessage[];
}

export interface ClaudeContentBlock {
  type: 'text';
  text: string;
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ClaudeContentBlock[];
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

export interface SendMessageOptions {
  apiKey: string;
  messages: ClaudeMessage[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
}

export interface SendMessageResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}
