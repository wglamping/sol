export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, ...utms } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  const GROUP_ID = '183294455540877031'; // Peregrino Sol Early Access

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        groups: [GROUP_ID],
        fields: {
          ...(utms.utm_source   && { utm_source:   utms.utm_source }),
          ...(utms.utm_medium   && { utm_medium:   utms.utm_medium }),
          ...(utms.utm_campaign && { utm_campaign: utms.utm_campaign }),
          ...(utms.utm_content  && { utm_content:  utms.utm_content }),
          ...(utms.utm_term     && { utm_term:     utms.utm_term }),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MailerLite error:', data);
      // Still return 200 — frontend redirects regardless
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Subscribe error:', err);
    // Still return 200 — frontend redirects regardless
    return res.status(200).json({ ok: true });
  }
}
