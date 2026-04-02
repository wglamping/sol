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

  try {
    // Update subscriber with full guest data fields
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          name:        firstName || '',
          last_name:   lastName  || '',
          phone:       phone     || '',
          // Custom fields — create these in MailerLite if not already present
          ...(source       && { how_heard:    source }),
          ...(notes        && { special_notes: notes }),
          ...(utm_source   && { utm_source }),
          ...(utm_medium   && { utm_medium }),
          ...(utm_campaign && { utm_campaign }),
          ...(utm_content  && { utm_content }),
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MailerLite save-guest error:', data);
    }

    // Always return 200 — don't block the Stripe redirect
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('save-guest error:', err);
    return res.status(200).json({ ok: true });
  }
}
