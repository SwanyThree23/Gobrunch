/**
 * API: Vault Pro - Secure Secret Management
 * GET /api/vault - List secrets (metadata only)
 * POST /api/vault - Store / Retrieve / Rotate / Delete secrets
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  storeSecret,
  retrieveSecret,
  listSecrets,
  rotateSecret,
  deleteSecret,
  getAuditLogs,
  getUserAuditLogs,
  processScheduledRotations,
} from '@/lib/services/vault';
import type { VaultSecretType } from '@/types';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
  }

  const secrets = listSecrets(userId);
  const auditLogs = getUserAuditLogs(userId);

  return NextResponse.json({ success: true, data: { secrets, recentAudit: auditLogs.slice(-20) } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'store': {
      const secret = storeSecret({
        userId: body.userId,
        name: body.name,
        type: body.type as VaultSecretType,
        value: body.value,
        rotationSchedule: body.rotationSchedule,
        expiresAt: body.expiresAt,
      });

      // Return without encrypted value
      const { encryptedValue: _e, iv: _i, authTag: _a, ...safe } = secret;
      return NextResponse.json({ success: true, data: safe });
    }

    case 'retrieve': {
      const result = retrieveSecret(body.userId, body.secretId);
      if (!result) {
        return NextResponse.json({ success: false, error: 'Secret not found or expired' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: { value: result.decryptedValue, name: result.secret.name, type: result.secret.type },
      });
    }

    case 'rotate': {
      const rotated = rotateSecret(body.userId, body.secretId, body.newValue);
      if (!rotated) {
        return NextResponse.json({ success: false, error: 'Secret not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: { rotated: true, lastRotatedAt: rotated.lastRotatedAt } });
    }

    case 'delete': {
      const deleted = deleteSecret(body.userId, body.secretId);
      return NextResponse.json({ success: deleted });
    }

    case 'audit': {
      const logs = body.secretId
        ? getAuditLogs(body.secretId)
        : getUserAuditLogs(body.userId);
      return NextResponse.json({ success: true, data: logs });
    }

    case 'process-rotations': {
      const result = processScheduledRotations();
      return NextResponse.json({ success: true, data: result });
    }

    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
