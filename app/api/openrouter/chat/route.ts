import { NextRequest, NextResponse } from 'next/server';
import { getUserFromHeader } from '@/lib/services/auth';
import { chatCompletion, chatCompletionStream, OpenRouterError } from '@/lib/services/openrouter';
import { aiChatSchema } from '@/lib/validators';
import type { ApiResponse, OpenRouterMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = aiChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { message, model, context } = parsed.data;

    // Build conversation messages
    const messages: OpenRouterMessage[] = [{ role: 'user', content: message }];

    // Add context if in a watch party
    if (context?.videoTitle) {
      messages.unshift({
        role: 'system',
        content: `The user is watching: "${context.videoTitle}"`,
      });
    }

    const isStreaming = request.headers.get('accept') === 'text/event-stream';

    if (isStreaming) {
      const stream = await chatCompletionStream(messages, {
        model,
        watchPartyMode: Boolean(context?.watchPartyId),
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const result = await chatCompletion(messages, {
      model,
      watchPartyMode: Boolean(context?.watchPartyId),
    });

    const assistantMessage = result.choices[0]?.message?.content || '';

    return NextResponse.json<ApiResponse<{ message: string; usage: typeof result.usage }>>({
      success: true,
      data: {
        message: assistantMessage,
        usage: result.usage,
      },
    });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `AI service error: ${error.message}` },
        { status: error.statusCode >= 400 ? error.statusCode : 502 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
