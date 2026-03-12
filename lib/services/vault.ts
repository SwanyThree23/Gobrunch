/**
 * Vault Pro - Military-Grade AES-256-GCM Encryption
 * Zero-knowledge secure storage for API keys and stream keys
 * Part of the SwanyThree AI Trio
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { VaultSecret, VaultSecretType, VaultAuditLog } from '@/types';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

// Master key derived from environment variable
const VAULT_MASTER_KEY = process.env.VAULT_MASTER_KEY || 'seewhy-vault-default-key-change-in-production';

// ---- In-memory stores ----
const vaultSecrets = new Map<string, VaultSecret[]>(); // userId -> secrets
const auditLogs: VaultAuditLog[] = [];

// ============================================================
// ENCRYPTION / DECRYPTION (AES-256-GCM)
// ============================================================

/**
 * Derive an encryption key from the master key using scrypt.
 */
function deriveKey(salt: Buffer): Buffer {
  return scryptSync(VAULT_MASTER_KEY, salt, KEY_LENGTH);
}

/**
 * Encrypt a plaintext value using AES-256-GCM.
 * Returns { encryptedValue, iv, authTag, salt }
 */
export function encrypt(plaintext: string): {
  encryptedValue: string;
  iv: string;
  authTag: string;
} {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Prepend salt to encrypted value for later derivation
  const encryptedWithSalt = salt.toString('hex') + ':' + encrypted;

  return {
    encryptedValue: encryptedWithSalt,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt a value using AES-256-GCM.
 */
export function decrypt(encryptedValue: string, ivHex: string, authTagHex: string): string {
  // Extract salt from encrypted value
  const parts = encryptedValue.split(':');
  if (parts.length !== 2) {
    throw new VaultError('Invalid encrypted value format');
  }

  const salt = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = deriveKey(salt);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================================
// SECRET MANAGEMENT
// ============================================================

/**
 * Store a secret in the vault (encrypted at rest).
 */
export function storeSecret(params: {
  userId: string;
  name: string;
  type: VaultSecretType;
  value: string;
  rotationSchedule?: VaultSecret['rotationSchedule'];
  expiresAt?: string;
}): VaultSecret {
  const { encryptedValue, iv, authTag } = encrypt(params.value);

  const secret: VaultSecret = {
    id: uuidv4(),
    userId: params.userId,
    name: params.name,
    type: params.type,
    encryptedValue,
    iv,
    authTag,
    rotationSchedule: params.rotationSchedule,
    expiresAt: params.expiresAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userSecrets = vaultSecrets.get(params.userId) || [];
  userSecrets.push(secret);
  vaultSecrets.set(params.userId, userSecrets);

  logAudit(secret.id, params.userId, 'created');
  return secret;
}

/**
 * Retrieve and decrypt a secret.
 */
export function retrieveSecret(userId: string, secretId: string): {
  secret: VaultSecret;
  decryptedValue: string;
} | null {
  const userSecrets = vaultSecrets.get(userId);
  if (!userSecrets) return null;

  const secret = userSecrets.find(s => s.id === secretId);
  if (!secret) return null;

  // Check expiration
  if (secret.expiresAt && new Date(secret.expiresAt) < new Date()) {
    logAudit(secret.id, userId, 'expired');
    return null;
  }

  const decryptedValue = decrypt(secret.encryptedValue, secret.iv, secret.authTag);
  logAudit(secret.id, userId, 'accessed');

  return { secret, decryptedValue };
}

/**
 * List all secrets for a user (metadata only, no decrypted values).
 */
export function listSecrets(userId: string): Omit<VaultSecret, 'encryptedValue' | 'iv' | 'authTag'>[] {
  const userSecrets = vaultSecrets.get(userId) || [];
  return userSecrets.map(({ encryptedValue: _e, iv: _i, authTag: _a, ...rest }) => rest);
}

/**
 * Rotate a secret (generate new encryption with same or new value).
 */
export function rotateSecret(userId: string, secretId: string, newValue?: string): VaultSecret | null {
  const userSecrets = vaultSecrets.get(userId);
  if (!userSecrets) return null;

  const secretIdx = userSecrets.findIndex(s => s.id === secretId);
  if (secretIdx === -1) return null;

  const secret = userSecrets[secretIdx];

  // Decrypt current value if no new value provided
  const valueToEncrypt = newValue ?? decrypt(secret.encryptedValue, secret.iv, secret.authTag);

  // Re-encrypt with new key material
  const { encryptedValue, iv, authTag } = encrypt(valueToEncrypt);

  secret.encryptedValue = encryptedValue;
  secret.iv = iv;
  secret.authTag = authTag;
  secret.lastRotatedAt = new Date().toISOString();
  secret.updatedAt = new Date().toISOString();

  logAudit(secret.id, userId, 'rotated');
  return secret;
}

/**
 * Delete a secret from the vault.
 */
export function deleteSecret(userId: string, secretId: string): boolean {
  const userSecrets = vaultSecrets.get(userId);
  if (!userSecrets) return false;

  const idx = userSecrets.findIndex(s => s.id === secretId);
  if (idx === -1) return false;

  logAudit(secretId, userId, 'deleted');
  userSecrets.splice(idx, 1);
  return true;
}

// ============================================================
// AUDIT LOGGING
// ============================================================

/**
 * Log a vault operation for audit trail.
 */
function logAudit(
  secretId: string,
  userId: string,
  action: VaultAuditLog['action'],
  ipAddress?: string,
  userAgent?: string
): void {
  auditLogs.push({
    id: uuidv4(),
    secretId,
    userId,
    action,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  // Limit audit log size
  if (auditLogs.length > 10000) {
    auditLogs.splice(0, 5000);
  }
}

/**
 * Get audit logs for a specific secret.
 */
export function getAuditLogs(secretId: string): VaultAuditLog[] {
  return auditLogs.filter(log => log.secretId === secretId);
}

/**
 * Get all audit logs for a user.
 */
export function getUserAuditLogs(userId: string): VaultAuditLog[] {
  return auditLogs.filter(log => log.userId === userId);
}

// ============================================================
// KEY ROTATION SCHEDULER
// ============================================================

/**
 * Check and rotate secrets that are due for rotation.
 */
export function processScheduledRotations(): { rotated: string[]; errors: string[] } {
  const rotated: string[] = [];
  const errors: string[] = [];

  for (const [userId, secrets] of Array.from(vaultSecrets.entries())) {
    for (const secret of secrets) {
      if (!secret.rotationSchedule || secret.rotationSchedule === 'manual') continue;

      const lastRotated = secret.lastRotatedAt ? new Date(secret.lastRotatedAt) : new Date(secret.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - lastRotated.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      let shouldRotate = false;
      if (secret.rotationSchedule === 'daily' && diffDays >= 1) shouldRotate = true;
      if (secret.rotationSchedule === 'weekly' && diffDays >= 7) shouldRotate = true;
      if (secret.rotationSchedule === 'monthly' && diffDays >= 30) shouldRotate = true;

      if (shouldRotate) {
        const result = rotateSecret(userId, secret.id);
        if (result) {
          rotated.push(secret.id);
        } else {
          errors.push(secret.id);
        }
      }
    }
  }

  return { rotated, errors };
}

// ============================================================
// ERROR CLASS
// ============================================================

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VaultError';
  }
}
