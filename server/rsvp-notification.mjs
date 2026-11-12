import { createHash } from 'node:crypto';
import wedding from '../src/wedding.json' with { type: 'json' };

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const field = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export function notification(payload, sender) {
  if (payload?.form_name !== 'wedding-rsvp') return null;
  if (typeof payload.id !== 'string' || !payload.id) throw new Error('Missing submission ID');
  const data = payload.data || {};
  if (data['bot-field']) return null;
  const name = field(data.name, 100);
  const email = field(data.email, 254);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['yes', 'no'].includes(data.attendance)) {
    throw new Error('Invalid RSVP fields; review the saved submission in Netlify');
  }
  const attendance = data.attendance === 'yes' ? 'Joyfully accepts' : 'Regretfully declines';
  const guests = data.attendance === 'no' ? '0' : field(String(data.guests || '1'), 10);
  const message = field(data.message, 1000) || 'No message included.';
  const rows = [['Guest', name], ['Email', email], ['Attendance', attendance], ['No of Person(s) Attending', guests], ['Message', message]];
  const text = `${wedding.theme}\n\nYour wedding invitation reply\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n\n')}\n\nSaved submission: ${payload.id}\nReply to this email to contact the guest.`;
  const html = `<div style="background:#faf9f5;padding:32px;color:#49473f;font-family:Georgia,serif;max-width:600px;margin:auto"><p style="font-size:12px;letter-spacing:2px;color:#806b48">${escapeHtml(wedding.theme)}</p><h1 style="font-weight:normal">Your wedding invitation reply</h1>${rows.map(([k, v]) => `<p style="margin:22px 0"><strong>${k}</strong><br><span style="white-space:pre-wrap">${escapeHtml(v)}</span></p>`).join('')}<hr style="border:0;border-top:1px solid #ded9cb"><p>Reply to this email to contact the guest.</p><p style="font-size:12px">Saved submission: ${escapeHtml(payload.id)}</p></div>`;
  return {
    key: `wedding-rsvp/${createHash('sha256').update(payload.id).digest('hex')}`,
    body: { from: sender, to: wedding.notifications.recipients, reply_to: email,
      subject: wedding.notifications.subject, text, html }
  };
}

export async function deliverNotification(payload, { env = process.env, fetchImpl = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (payload?.form_name !== 'wedding-rsvp') return { skipped: true };
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw new Error('Set RESEND_API_KEY and RESEND_FROM_EMAIL in Netlify Functions environment');
  }
  const mail = notification(payload, env.RESEND_FROM_EMAIL);
  if (!mail) return { skipped: true };
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': mail.key },
        body: JSON.stringify(mail.body), signal: AbortSignal.timeout(5000)
      });
    } catch {
      if (attempt === 2) throw new Error('Resend network failure; RSVP remains saved in Netlify');
      await sleep(500 * (attempt + 1));
      continue;
    }
    if (response.ok) {
      const result = await response.json();
      if (!result.id) throw new Error('Resend did not return an email ID');
      return { emailId: result.id };
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await sleep(500 * (attempt + 1));
      continue;
    }
    // Do not log the provider response: it may contain personal data.
    throw new Error(`Resend rejected notification (HTTP ${response.status}); RSVP remains saved in Netlify`);
  }
}
