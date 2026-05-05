import type {
  ClaudeRequest,
  ClaudeResponse,
  ClaudeErrorResponse,
  SendMessageOptions,
  SendMessageResult,
} from './types';

const DEFAULT_API_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.5;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export class ClaudeApiError extends Error {
  statusCode: number;
  errorType: string;

  constructor(message: string, statusCode: number, errorType: string) {
    super(message);
    this.name = 'ClaudeApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function makeRequest(apiKey: string, body: ClaudeRequest): Promise<ClaudeResponse> {
  const response = await fetch(`${DEFAULT_API_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ClaudeErrorResponse;
    throw new ClaudeApiError(
      errorData.error?.message ?? `HTTP ${response.status}`,
      response.status,
      errorData.error?.type ?? 'unknown',
    );
  }

  return (await response.json()) as ClaudeResponse;
}

export async function sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
  const { apiKey, messages, systemPrompt, model, maxTokens, temperature } = options;

  const body: ClaudeRequest = {
    model: model ?? DEFAULT_MODEL,
    max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: temperature ?? DEFAULT_TEMPERATURE,
    messages,
    ...(systemPrompt
      ? { system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }] }
      : {}),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await makeRequest(apiKey, body);
      const text = result.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        text,
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        cacheCreationInputTokens: result.usage.cache_creation_input_tokens,
        cacheReadInputTokens: result.usage.cache_read_input_tokens,
      };
    } catch (error) {
      lastError = error as Error;

      if (error instanceof ClaudeApiError) {
        // Don't retry auth errors or invalid requests
        if (error.statusCode === 401 || error.statusCode === 400) {
          throw error;
        }
        // Retry on rate limit (429) or server errors (5xx)
        if (error.statusCode === 429 || error.statusCode >= 500) {
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
            await sleep(delay);
            continue;
          }
        }
      }

      throw error;
    }
  }

  throw lastError ?? new Error('Failed to send message');
}

/** Validates an API key by making a minimal request */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await sendMessage({
      apiKey,
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 10,
    });
    return true;
  } catch (error) {
    if (error instanceof ClaudeApiError && error.statusCode === 401) {
      return false;
    }
    // Other errors (network, rate limit) don't mean the key is invalid
    throw error;
  }
}
