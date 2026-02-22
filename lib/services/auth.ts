import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { User, JWTPayload, AuthResponse, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 12;

// In-memory user store (replace with database in production)
const users = new Map<string, User & { passwordHash: string }>();

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(user: User): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Generate a refresh token.
 */
export function generateRefreshToken(user: User): string {
  return jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Register a new user.
 */
export async function registerUser(
  email: string,
  username: string,
  displayName: string,
  password: string
): Promise<AuthResponse> {
  // Check for existing user
  for (const user of Array.from(users.values())) {
    if (user.email === email) {
      throw new AuthError('Email already registered');
    }
    if (user.username === username) {
      throw new AuthError('Username already taken');
    }
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const user: User & { passwordHash: string } = {
    id: uuidv4(),
    email,
    username,
    displayName,
    role: 'viewer' as UserRole,
    status: 'online',
    subscription: 'free',
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  users.set(user.id, user);

  const { passwordHash: _, ...safeUser } = user;
  const token = generateToken(safeUser);
  const refreshToken = generateRefreshToken(safeUser);

  return { user: safeUser, token, refreshToken };
}

/**
 * Authenticate a user by email and password.
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  let foundUser: (User & { passwordHash: string }) | undefined;

  for (const user of Array.from(users.values())) {
    if (user.email === email) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    throw new AuthError('Invalid email or password');
  }

  const isValid = await verifyPassword(password, foundUser.passwordHash);
  if (!isValid) {
    throw new AuthError('Invalid email or password');
  }

  // Update status
  foundUser.status = 'online';
  foundUser.updatedAt = new Date().toISOString();

  const { passwordHash: _, ...safeUser } = foundUser;
  const token = generateToken(safeUser);
  const refreshToken = generateRefreshToken(safeUser);

  return { user: safeUser, token, refreshToken };
}

/**
 * Get a user by ID (without password hash).
 */
export function getUserById(id: string): User | null {
  const user = users.get(id);
  if (!user) return null;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Extract user from authorization header.
 */
export function getUserFromHeader(authHeader: string | null): JWTPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return verifyToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

/** Custom error class for authentication errors */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
