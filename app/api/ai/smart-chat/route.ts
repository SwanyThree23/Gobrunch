/**
 * API: AI Tools Wrapper Pro - Smart Chat with Compression & Routing
 * POST /api/ai/smart-chat - Send message with auto-compression and model routing
 * GET /api/ai/smart-chat - Get wrapper config and cost summary
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  smartChat,
  compressPrompt,
  getWrapperConfig,
  updateWrapperConfig,
  getDailyCostSummary,
  selectModel,
} from '@/lib/services/ai-wrapper';
import type { OpenRouterMessage } from '@/types';

export async function GET() {
  const config = getWrapperConfig();
  const costSummary = getDailyCostSummary();
  const selectedModel = selectModel();

  return NextResponse.json({
    success: true,
    data: { config, costSummary, selectedModel },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action || 'chat') {
    case 'chat': {
      const messages: OpenRouterMessage[] = body.messages;
      if (!messages || messages.length === 0) {
        return NextResponse.json({ success: false, error: 'messages required' }, { status: 400 });
      }

      try {
        const result = await smartChat(messages, {
          strategy: body.strategy,
          compress: body.compress,
          maxTokens: body.maxTokens,
          temperature: body.temperature,
        });

        return NextResponse.json({
          success: true,
          data: {
            response: result.response,
            modelUsed: result.modelUsed,
            costUsd: result.costUsd,
            compression: result.compressed ? {
              originalTokens: result.compressed.originalTokens,
              compressedTokens: result.compressed.compressedTokens,
              compressionRatio: result.compressed.compressionRatio,
              tokensSaved: result.compressed.tokensSaved,
              costSaved: result.compressed.estimatedCostSaved,
            } : null,
          },
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'AI request failed',
        }, { status: 500 });
      }
    }

    case 'compress': {
      if (!body.text) {
        return NextResponse.json({ success: false, error: 'text required' }, { status: 400 });
      }
      const result = compressPrompt(body.text, body.config);
      return NextResponse.json({ success: true, data: result });
    }

    case 'update-config': {
      const config = updateWrapperConfig(body.config);
      return NextResponse.json({ success: true, data: config });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
