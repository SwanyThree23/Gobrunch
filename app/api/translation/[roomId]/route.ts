/**
 * API: Multilingual Chat & Translation
 * GET /api/translation/:roomId - Get translation config & supported languages
 * POST /api/translation/:roomId - Translate messages, configure, detect language
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  setTranslationConfig,
  getTranslationConfig,
  translateText,
  translateChatMessage,
  autoTranslateForRoom,
  setLiveCaptionConfig,
  getLiveCaptionConfig,
  detectLanguage,
  getSupportedLanguages,
} from '@/lib/services/translation';
import type { SupportedLanguage, ChatMessage } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const translationConfig = getTranslationConfig(roomId);
  const captionConfig = getLiveCaptionConfig(roomId);
  const languages = getSupportedLanguages();

  return NextResponse.json({
    success: true,
    data: { translationConfig, captionConfig, languages },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'configure': {
      const config = setTranslationConfig(roomId, body.config);
      return NextResponse.json({ success: true, data: config });
    }

    case 'translate': {
      const result = await translateText(
        body.text,
        body.targetLanguage as SupportedLanguage,
        body.sourceLanguage as SupportedLanguage | undefined
      );
      return NextResponse.json({ success: true, data: result });
    }

    case 'translate-message': {
      const message: ChatMessage = body.message;
      const translated = await translateChatMessage(
        message,
        body.targetLanguages as SupportedLanguage[]
      );
      return NextResponse.json({ success: true, data: translated });
    }

    case 'auto-translate': {
      const message: ChatMessage = body.message;
      const translated = await autoTranslateForRoom(roomId, message);
      return NextResponse.json({ success: true, data: translated });
    }

    case 'detect': {
      const language = await detectLanguage(body.text);
      return NextResponse.json({ success: true, data: { language } });
    }

    case 'caption-config': {
      const config = setLiveCaptionConfig(roomId, body.config);
      return NextResponse.json({ success: true, data: config });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
