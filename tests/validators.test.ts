import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  roomCreateSchema,
  watchPartyCreateSchema,
  chatMessageSchema,
  aiChatSchema,
} from '@/lib/validators';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'john_doe',
      displayName: 'John Doe',
      password: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects username with special characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'john doe!',
      displayName: 'John Doe',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'johndoe',
      displayName: 'John Doe',
      password: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'johndoe',
      displayName: 'John Doe',
      password: 'Passwordd',
    });
    expect(result.success).toBe(false);
  });
});

describe('roomCreateSchema', () => {
  it('accepts valid room data', () => {
    const result = roomCreateSchema.safeParse({
      title: 'My Room',
      description: 'A cool room',
      visibility: 'public',
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults', () => {
    const result = roomCreateSchema.parse({
      title: 'My Room',
    });
    expect(result.visibility).toBe('public');
    expect(result.maxViewers).toBe(1000);
    expect(result.chatEnabled).toBe(true);
    expect(result.tags).toEqual([]);
  });

  it('rejects empty title', () => {
    const result = roomCreateSchema.safeParse({
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too many tags', () => {
    const result = roomCreateSchema.safeParse({
      title: 'Room',
      tags: Array(11).fill('tag'),
    });
    expect(result.success).toBe(false);
  });
});

describe('watchPartyCreateSchema', () => {
  it('accepts valid watch party data', () => {
    const result = watchPartyCreateSchema.safeParse({
      title: 'Movie Night',
      videoUrl: 'https://youtube.com/watch?v=abc123',
      videoSource: 'youtube',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid video URL', () => {
    const result = watchPartyCreateSchema.safeParse({
      title: 'Movie Night',
      videoUrl: 'not-a-url',
      videoSource: 'youtube',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid video source', () => {
    const result = watchPartyCreateSchema.safeParse({
      title: 'Movie Night',
      videoUrl: 'https://example.com/video',
      videoSource: 'netflix',
    });
    expect(result.success).toBe(false);
  });
});

describe('chatMessageSchema', () => {
  it('accepts valid chat message', () => {
    const result = chatMessageSchema.safeParse({
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Hello!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = chatMessageSchema.safeParse({
      roomId: '550e8400-e29b-41d4-a716-446655440000',
      content: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('aiChatSchema', () => {
  it('accepts valid AI chat request', () => {
    const result = aiChatSchema.safeParse({
      message: 'What is this stream about?',
    });
    expect(result.success).toBe(true);
  });

  it('applies default model', () => {
    const result = aiChatSchema.parse({
      message: 'Hello',
    });
    expect(result.model).toBe('openai/gpt-4o');
  });

  it('rejects empty message', () => {
    const result = aiChatSchema.safeParse({
      message: '',
    });
    expect(result.success).toBe(false);
  });
});
