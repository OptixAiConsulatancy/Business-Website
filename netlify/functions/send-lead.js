exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) };
  }

  let lead;
  try {
    lead = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, email, business, need } = lead;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'email required' }) };
  }

  const fromAddress = process.env.FROM_EMAIL || 'Optix AI <onboarding@resend.dev>';
  const ownerEmail = process.env.OWNER_EMAIL || 'optixai01@gmail.com';

  try {
    // Email to the visitor
    await sendEmail(apiKey, {
      from: fromAddress,
      to: email,
      subject: "Here's your free discovery call link — Optix",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#7c6dfa;margin-bottom:8px;">Hey ${name || 'there'} 👋</h2>
          <p style="font-size:16px;line-height:1.6;">Thanks for chatting with us! Based on what you told us about <strong>${business || 'your business'}</strong>, we reckon we can save your team serious time by automating <strong>${need || 'your key processes'}</strong>.</p>
          <p style="font-size:16px;line-height:1.6;">Book your free 30-minute discovery call below — we'll map out exactly where automation can make the biggest difference for you, no obligation:</p>
          <a href="https://calendly.com/optixai01/30min"
             style="display:inline-block;background:#7c6dfa;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin:16px 0;">
            📅 Book Your Free Discovery Call
          </a>
          <p style="font-size:14px;color:#666;margin-top:24px;">Talk soon,<br/><strong>The Optix Team</strong><br/>Gold Coast, Queensland</p>
        </div>
      `
    });

    // Notification email to owner
    await sendEmail(apiKey, {
      from: fromAddress,
      to: ownerEmail,
      subject: `New qualified lead: ${name || 'Unknown'} — ${business || 'Unknown business'}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#7c6dfa;">New Qualified Lead</h2>
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${name || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Business</td><td style="padding:8px 0;font-weight:600;">${business || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Needs</td><td style="padding:8px 0;font-weight:600;">${need || '—'}</td></tr>
          </table>
          <p style="font-size:14px;color:#666;margin-top:16px;">They've been sent the Calendly booking link automatically.</p>
        </div>
      `
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

async function sendEmail(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${text}`);
  }
  return res.json();
}
