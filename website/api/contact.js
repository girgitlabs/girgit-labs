/**
 * POST /api/contact — contact form handler.
 *
 * Vercel Node function. Lives at website/api/contact.js so that, with the
 * Vercel Root Directory set to `website`, the route resolves to /api/contact.
 *
 * Delivers via Resend (plain fetch, no dependencies). Configure:
 *
 *   RESEND_API_KEY   required
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // Vercel pre-parses the body for the Node runtime; parse defensively anyway.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = Object.fromEntries(new URLSearchParams(body));
    }
  }
  if (!body || typeof body !== 'object') body = {};

  // Honeypot: a filled hidden field means a bot. Accept silently so the bot
  // has no signal, but never send anything.
  if (clean(body.company_website, 200)) {
    return res.status(200).json({ ok: true });
  }

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
  if (errors.length) {
    return res.status(400).json({ ok: false, error: 'invalid', fields: errors });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) {
    // Misconfiguration, not a visitor error. Say so loudly in the logs.
    console.error('[contact] not configured: set RESEND_API_KEY and CONTACT_TO');
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  const from = process.env.CONTACT_FROM || 'Girgit Labs <onboarding@resend.dev>';
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
        to: [to],
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
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] send threw:', err);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
}
