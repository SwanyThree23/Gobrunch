import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

/**
 * VaultPro encryption utilities. Uses AES-256-GCM with 12‑byte IV and
 * 16‑byte authentication tag. Additional authenticated data (AAD) may be
 * provided (e.g. user id) to bind the ciphertext to context.
 *
 * The key must be 32 bytes long (256 bits); supply via
 * STREAM_KEY_ENCRYPTION_KEY env var or call setKey directly during
 * initialization.
 */
let encryptionKey: Buffer | null = null;

export function setKey(key: string | Buffer) {
    const buf = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
    if (buf.length !== 32) {
        throw new Error('VaultPro: encryption key must be 32 bytes');
    }
    encryptionKey = buf;
}

function ensureKey() {
    if (!encryptionKey) {
        const envKey = process.env.STREAM_KEY_ENCRYPTION_KEY;
        if (!envKey) {
            throw new Error('VaultPro key not set');
        }
        setKey(envKey);
    }
}

interface Encrypted {
    iv: string; // base64
    tag: string; // base64
    data: string; // base64
}

export function encrypt(plain: string, aad?: string): Encrypted {
    ensureKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey!, iv);
    if (aad) cipher.setAAD(Buffer.from(aad));
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: encrypted.toString('base64')
    };
}

export function decrypt(enc: Encrypted, aad?: string): string {
    ensureKey();
    const iv = Buffer.from(enc.iv, 'base64');
    const tag = Buffer.from(enc.tag, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey!, iv);
    decipher.setAuthTag(tag);
    if (aad) decipher.setAAD(Buffer.from(aad));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(enc.data, 'base64')),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}

export function generateRandomKey(): string {
    return randomBytes(32).toString('base64');
}
