/**
 * API: Stream Panel Management (20-Person Grid)
 * GET /api/panel/:roomId - Get panel state
 * POST /api/panel/:roomId - Join panel / Update participant
 * PATCH /api/panel/:roomId - Update layout / spotlight
 * DELETE /api/panel/:roomId - Leave panel
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getPanel,
  addPanelParticipant,
  removePanelParticipant,
  setSpotlight,
  clearSpotlight,
  setPanelLayout,
  updateParticipantMedia,
  toggleRaisedHand,
  calculateGridLayout,
  getVirtualSourceOptions,
  setVerticalCinema,
  getVerticalCinemaConfig,
} from '@/lib/services/panel';
import type { PanelLayout } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const panel = getPanel(roomId);
  const gridLayout = calculateGridLayout(panel.participants.length, panel.layout);
  const verticalCinema = getVerticalCinemaConfig(roomId);
  const virtualSources = getVirtualSourceOptions();

  return NextResponse.json({
    success: true,
    data: { panel, gridLayout, verticalCinema, virtualSources },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await request.json();
  const { action, userId, role } = body;

  switch (action) {
    case 'join': {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
      }
      const participant = addPanelParticipant(roomId, userId, role);
      if (!participant) {
        return NextResponse.json({ success: false, error: 'Panel is full (max 20)' }, { status: 409 });
      }
      return NextResponse.json({ success: true, data: participant });
    }

    case 'update-media': {
      const updated = updateParticipantMedia(roomId, userId, body.updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    case 'raise-hand': {
      const raised = toggleRaisedHand(roomId, userId);
      return NextResponse.json({ success: true, data: { raisedHand: raised } });
    }

    case 'vertical-cinema': {
      const config = setVerticalCinema(roomId, body.config);
      return NextResponse.json({ success: true, data: config });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'spotlight': {
      const event = setSpotlight(roomId, body.userId, body.triggeredBy);
      if (!event) {
        return NextResponse.json({ success: false, error: 'User not found in panel' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: event });
    }

    case 'clear-spotlight': {
      const event = clearSpotlight(roomId, body.triggeredBy);
      return NextResponse.json({ success: true, data: event });
    }

    case 'layout': {
      const panel = setPanelLayout(roomId, body.layout as PanelLayout);
      if (!panel) {
        return NextResponse.json({ success: false, error: 'Panel not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: panel });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
  }

  const removed = removePanelParticipant(roomId, userId);
  return NextResponse.json({ success: removed, data: { removed } });
}
