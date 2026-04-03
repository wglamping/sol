export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    source,
    notes,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content
  } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  const SHEETS_WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL;

  // Run MailerLite and Google Sheets writes in parallel
  await Promise.allSettled([

    // ── MAILERLITE ────────────────────────────────────────────────────────────
    fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          name:      firstName || '',
          last_name: lastName  || '',
          phone:     phone     || '',
          ...(source       && { how_heard:     source }),
          ...(notes        && { special_notes: notes }),
          ...(utm_source   && { utm_source }),
          ...(utm_medium   && { utm_medium }),
          ...(utm_campaign && { utm_campaign }),
          ...(utm_content  && { utm_content }),
        }
      }),
    }).then(r => r.json()).catch(err => console.error('MailerLite error:', err)),

    // ── GOOGLE SHEETS ─────────────────────────────────────────────────────────
    SHEETS_WEBHOOK_URL ? fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp:    new Date().toISOString(),
        firstName:    firstName    || '',
        lastName:     lastName     || '',
        email:        email        || '',
        phone:        phone        || '',
        how_heard:    source       || '',
        notes:        notes        || '',
        utm_source:   utm_source   || '',
        utm_medium:   utm_medium   || '',
        utm_campaign: utm_campaign || '',
        utm_content:  utm_content  || '',
      }),
    }).catch(err => console.error('Sheets error:', err)) : Promise.resolve(),

  ]);

  // Always return 200 — never block the Stripe redirect
  return res.status(200).json({ ok: true });
}
