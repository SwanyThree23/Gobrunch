const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Auth API', () => {
  const BASE = 'http://localhost:3001/api';

  it('should reject registration with missing fields', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test' }),
    });
    assert.strictEqual(res.status, 400);
  });

  it('should reject login with invalid credentials', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@test.com', password: 'wrongpassword' }),
    });
    assert.ok([401, 500].includes(res.status));
  });

  it('should reject protected routes without token', async () => {
    const res = await fetch(`${BASE}/auth/me`);
    assert.strictEqual(res.status, 401);
  });

  it('should return health check', async () => {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
  });
});
