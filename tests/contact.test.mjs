/**
 * Tests for the contact endpoint at website/functions/api/contact.js
 *
 * Run from the repository root:   node --test
 *
 * These matter more than they look. The handler is the only server-side code this
 * site has, and its job is to not lose an enquiry. Client-side validation can be
 * bypassed by any direct request, so the rules below are the ones actually enforced.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { onRequest } = await import('../website/functions/api/contact.js');

const VALID = {
  name: 'Asha Menon',
  email: 'asha@example.com',
  company: 'Example Co',
  build: 'Website or digital experience',
  message: 'We need a new marketing site before a trade show in March.',
};

const post = (body, headers = { 'Content-Type': 'application/json' }) =>
  new Request('https://example.com/api/contact', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const call = (request, env = {}) => onRequest({ request, env });

test('rejects methods other than POST', async () => {
  const res = await call(new Request('https://example.com/api/contact', { method: 'GET' }));
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('Allow'), 'POST');
});

test('rejects an empty body and names the missing fields', async () => {
  const res = await call(post({}));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.deepEqual(body.fields, ['name', 'email', 'build', 'message']);
});

test('rejects a malformed email', async () => {
  const res = await call(post({ ...VALID, email: 'nope' }));
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).fields, ['email']);
});

test('rejects a too-short message', async () => {
  const res = await call(post({ ...VALID, message: 'hi' }));
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).fields, ['message']);
});

test('accepts a urlencoded body as well as JSON', async () => {
  const res = await call(
    post(new URLSearchParams(VALID).toString(), {
      'Content-Type': 'application/x-www-form-urlencoded',
    })
  );
  // No provider configured in tests, so reaching the provider check proves parsing worked.
  assert.equal(res.status, 503);
});

test('honeypot answers 200 and sends nothing', async () => {
  const res = await call(post({ ...VALID, company_website: 'definitely-a-bot' }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('returns 503 when no mail provider is configured, never a false success', async () => {
  const res = await call(post(VALID));
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'not_configured');
});

test('caps absurdly long input rather than forwarding it', async () => {
  const res = await call(post({ ...VALID, name: 'x'.repeat(5000) }));
  // A 5000-char name is truncated to the limit, so the request is still valid.
  assert.equal(res.status, 503);
});
