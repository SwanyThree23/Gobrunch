import type { OpenRouterRequest, OpenRouterResponse, OpenRouterMessage, AIModel } from '@/types';
import { OPENROUTER_API_URL, OPENROUTER_REFERER, AI_SYSTEM_PROMPT, AI_WATCHPARTY_PROMPT } from '@/lib/constants';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

interface ChatOptions {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  watchPartyMode?: boolean;
}

/**
 * Send a chat completion request to OpenRouter.
 */
export async function chatCompletion(
  messages: OpenRouterMessage[],
  options: ChatOptions = {}
): Promise<OpenRouterResponse> {
  const {
    model = 'openai/gpt-4o',
    temperature = 0.7,
    maxTokens = 1024,
    stream = false,
    watchPartyMode = false,
  } = options;

  const systemPrompt = watchPartyMode ? AI_WATCHPARTY_PROMPT : AI_SYSTEM_PROMPT;

  const requestBody: OpenRouterRequest = {
    model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature,
    max_tokens: maxTokens,
    stream,
  };

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': OPENROUTER_REFERER,
      'X-Title': 'SeeWhy LIVE',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new OpenRouterError(
      `OpenRouter API error: ${response.status}`,
      response.status,
      errorBody
    );
  }

  return response.json();
}

/**
 * Stream a chat completion response from OpenRouter.
 * Returns a ReadableStream of server-sent events.
 */
export async function chatCompletionStream(
  messages: OpenRouterMessage[],
  options: Omit<ChatOptions, 'stream'> = {}
): Promise<ReadableStream<Uint8Array>> {
  const {
    model = 'openai/gpt-4o',
    temperature = 0.7,
    maxTokens = 1024,
    watchPartyMode = false,
  } = options;

  const systemPrompt = watchPartyMode ? AI_WATCHPARTY_PROMPT : AI_SYSTEM_PROMPT;

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': OPENROUTER_REFERER,
      'X-Title': 'SeeWhy LIVE',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    throw new OpenRouterError(
      `OpenRouter streaming error: ${response.status}`,
      response.status,
      errorBody
    );
  }

  return response.body;
}

/**
 * Get available models from OpenRouter.
 */
export async function getAvailableModels(): Promise<{ id: string; name: string }[]> {
  const response = await fetch(`${OPENROUTER_API_URL}/models`, {
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': OPENROUTER_REFERER,
    },
  });

  if (!response.ok) {
    throw new OpenRouterError('Failed to fetch models', response.status);
  }

  const data = await response.json();
  return data.data?.map((m: { id: string; name: string }) => ({
    id: m.id,
    name: m.name,
  })) ?? [];
}

/** Custom error class for OpenRouter API errors */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}
