import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserById,
  AuthError,
} from '@/lib/services/auth';
import type { User } from '@/types';

describe('password hashing', () => {
  it('hashes a password', async () => {
    const hash = await hashPassword('myPassword123');
    expect(hash).not.toBe('myPassword123');
    expect(hash).toHaveLength(60);
  });

  it('verifies correct password', async () => {
    const hash = await hashPassword('myPassword123');
    const isValid = await verifyPassword('myPassword123', hash);
    expect(isValid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('myPassword123');
    const isValid = await verifyPassword('wrongPassword', hash);
    expect(isValid).toBe(false);
  });
});

describe('JWT tokens', () => {
  const mockUser: User = {
    id: 'test-id-123',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    role: 'viewer',
    status: 'online',
    subscription: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('generates and verifies a token', () => {
    const token = generateToken(mockUser);
    expect(token).toBeDefined();

    const payload = verifyToken(token);
    expect(payload.userId).toBe('test-id-123');
    expect(payload.email).toBe('test@example.com');
    expect(payload.role).toBe('viewer');
  });

  it('rejects invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });
});

describe('user registration and login', () => {
  it('registers a new user', async () => {
    const result = await registerUser(
      `test-${Date.now()}@example.com`,
      `user${Date.now()}`,
      'Test User',
      'Password123'
    );

    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toContain('test-');
    expect(result.user.role).toBe('viewer');
    expect(result.user.subscription).toBe('free');
  });

  it('logs in an existing user', async () => {
    const email = `login-test-${Date.now()}@example.com`;
    await registerUser(email, `loginuser${Date.now()}`, 'Login User', 'Password123');

    const result = await loginUser(email, 'Password123');
    expect(result.user.email).toBe(email);
    expect(result.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const email = `wrong-pw-${Date.now()}@example.com`;
    await registerUser(email, `wrongpw${Date.now()}`, 'Wrong PW', 'Password123');

    await expect(loginUser(email, 'WrongPassword1')).rejects.toThrow(AuthError);
  });

  it('rejects login with non-existent email', async () => {
    await expect(loginUser('nonexistent@example.com', 'Password123')).rejects.toThrow(
      AuthError
    );
  });

  it('rejects duplicate email registration', async () => {
    const email = `dup-${Date.now()}@example.com`;
    await registerUser(email, `dup${Date.now()}`, 'Dup User', 'Password123');

    await expect(
      registerUser(email, `dup2${Date.now()}`, 'Dup User 2', 'Password123')
    ).rejects.toThrow(AuthError);
  });

  it('retrieves user by ID after registration', async () => {
    const result = await registerUser(
      `getbyid-${Date.now()}@example.com`,
      `getbyid${Date.now()}`,
      'GetById User',
      'Password123'
    );

    const user = getUserById(result.user.id);
    expect(user).not.toBeNull();
    expect(user!.id).toBe(result.user.id);
  });
});
