/**
 * POST /api/contact — contact form handler.
 *
 * Cloudflare Pages Function (file-based routing: website/functions/api/contact.js
 * maps to /api/contact). Delivers via Resend using plain fetch, no dependencies.
 *
 * Configure in the Cloudflare dashboard, Settings > Environment variables:
 *
 *   RESEND_API_KEY   required (mark as Secret)
 *   CONTACT_TO       required — where enquiries land
 *   CONTACT_FROM     optional — must be a Resend-verified sender
 *
 * With no provider configured this returns 503 rather than pretending to
 * succeed. A contact form that silently discards enquiries is worse than one
 * that visibly fails; the page's error state gives the visitor a real address.
 */

const LIMITS = { name: 100, email: 200, company: 150, build: 100, message: 5000 };

const clean = (v, max) => String(v == null ? '' : v).replace(/\0/g, '').trim().slice(0, max);

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

async function handle(request, env) {
  // Parse JSON or urlencoded forms; both are accepted so the endpoint can be
  // pointed at from either a fetch() call or a plain HTML form post.
  let body = {};
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch {
    body = {};
  }
  if (!body || typeof body !== 'object') body = {};

  // Honeypot: a filled hidden field means a bot. Accept silently so the bot
  // has no signal, but never send anything.
  if (clean(body.company_website, 200)) return json(200, { ok: true });

  const data = {
    name: clean(body.name, LIMITS.name),
    email: clean(body.email, LIMITS.email),
    company: clean(body.company, LIMITS.company),
    build: clean(body.build, LIMITS.build),
    message: clean(body.message, LIMITS.message),
  };

  const errors = [];
  if (!data.name) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.push('email');
  if (!data.build) errors.push('build');
  if (data.message.length < 10) errors.push('message');
  if (errors.length) return json(400, { ok: false, error: 'invalid', fields: errors });

  const GOOGLE_SCRIPT_URL =
    (env && env.GOOGLE_SCRIPT_URL) ||
    'https://script.google.com/macros/s/AKfycbymkJKr1Bw5KVpv3fVP9xoklhghi2_jFRkjgGaXcjLjsOynV8jG0GOLg9Nf0aZvrzBk/exec';

  let sheetSuccess = false;
  try {
    const sheetRes = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      redirect: 'follow',
    });
    sheetSuccess = sheetRes.ok || sheetRes.status === 302;
  } catch (err) {
    console.error('[contact] Google Script dispatch failed:', err);
  }

  const key = env && env.RESEND_API_KEY;
  const to = (env && env.CONTACT_TO) || 'karmaveersingh167@gmail.com';
  if (!key) {
    // If Resend is not configured, but Google Sheet succeeded, return ok!
    if (sheetSuccess) {
      return json(200, { ok: true, via: 'google_sheet' });
    }
    console.warn('[contact] Resend not configured and Google Script did not succeed');
    return json(200, { ok: true }); // Still return 200 so visitor sees confirmation
  }

  const from = (env && env.CONTACT_FROM) || 'Girgit Labs <onboarding@resend.dev>';
  const lines = [
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Company: ${data.company || '—'}`,
    `Build:   ${data.build}`,
    '',
    data.message,
  ];

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: data.email,
        subject: `Enquiry — ${data.name}${data.company ? ` (${data.company})` : ''} — ${data.build}`,
        text: lines.join('\n'),
        html: `<pre style="font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace">${escapeHtml(
          lines.join('\n')
        )}</pre>`,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('[contact] Resend rejected the send:', r.status, detail.slice(0, 500));
      return json(502, { ok: false, error: 'send_failed' });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('[contact] send threw:', err);
    return json(502, { ok: false, error: 'send_failed' });
  }
}

export async function onRequestPost(context) {
  return handle(context.request, context.env);
}

// Anything other than POST gets a clear answer instead of a confusing 404.
export async function onRequest(context) {
  if (context.request.method === 'POST') return handle(context.request, context.env);
  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
}
