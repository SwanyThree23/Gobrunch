/**
 * API: SwanyBot Guardian AI - Moderation, Transcription, Highlights
 * GET /api/moderation/:roomId - Get config, stats, logs
 * POST /api/moderation/:roomId - Moderate, transcribe, generate highlights
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  setModerationConfig,
  getModerationConfig,
  moderateMessage,
  getModerationLogs,
  getModerationStats,
  addTranscriptionSegment,
  getTranscription,
  getFullTranscript,
  generateHighlights,
  createManualClip,
  getHighlightClips,
} from '@/lib/services/swanybot';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const url = new URL(request.url);
  const section = url.searchParams.get('section') || 'all';

  const data: Record<string, unknown> = {};

  if (section === 'all' || section === 'moderation') {
    data.moderationConfig = getModerationConfig(roomId);
    data.moderationStats = getModerationStats(roomId);
    data.moderationLogs = getModerationLogs(roomId, 50);
  }

  if (section === 'all' || section === 'transcription') {
    data.transcription = getTranscription(roomId);
    data.fullTranscript = getFullTranscript(roomId);
  }

  if (section === 'all' || section === 'highlights') {
    data.highlightClips = getHighlightClips(roomId);
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await request.json();
  const { action } = body;

  switch (action) {
    // ---- Moderation ----
    case 'moderate': {
      const result = moderateMessage(roomId, body.messageId, body.content, body.userId);
      return NextResponse.json({ success: true, data: result });
    }

    case 'set-config': {
      const config = setModerationConfig(roomId, body.config);
      return NextResponse.json({ success: true, data: config });
    }

    // ---- Transcription ----
    case 'add-segment': {
      const segment = addTranscriptionSegment({
        roomId,
        startTime: body.startTime,
        endTime: body.endTime,
        text: body.text,
        speaker: body.speaker,
        language: body.language || 'en',
        confidence: body.confidence || 0.9,
      });
      return NextResponse.json({ success: true, data: segment });
    }

    // ---- Highlights ----
    case 'generate-highlights': {
      const clips = generateHighlights(roomId);
      return NextResponse.json({ success: true, data: clips });
    }

    case 'create-clip': {
      const clip = createManualClip({
        roomId,
        title: body.title,
        startTime: body.startTime,
        endTime: body.endTime,
        tags: body.tags,
      });
      return NextResponse.json({ success: true, data: clip });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
