const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Videos API', () => {
  const BASE = 'http://localhost:3001/api';

  it('should return video feed', async () => {
    const res = await fetch(`${BASE}/videos`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.videos));
    assert.ok(typeof data.total === 'number');
  });

  it('should return 404 for non-existent video', async () => {
    const res = await fetch(`${BASE}/videos/00000000-0000-0000-0000-000000000000`);
    assert.strictEqual(res.status, 404);
  });

  it('should reject upload without auth', async () => {
    const res = await fetch(`${BASE}/videos`, { method: 'POST' });
    assert.strictEqual(res.status, 401);
  });
});
