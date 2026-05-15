const SYSTEM_PROMPT = `You are an AI assistant for Automately, an AI automation consultancy based on the Gold Coast, Australia. You help Australian SMBs understand how AI automation can transform their business.

Your goals in order:
1. Greet warmly and ask what their business does
2. Identify their biggest repetitive or time-wasting tasks
3. Recommend specific Automately services that solve their problem
4. Qualify them by understanding urgency and readiness
5. Invite them to book a free 30-minute discovery call

Our services:
- Lead Follow-up Agents: Auto-respond to enquiries, qualify leads, book appointments
- Document Processing: Extract data from invoices, quotes, forms into CRM or spreadsheets
- Customer Support Bots: Handle FAQs and triage tickets 24/7
- Automated Reporting: Pull data from all sources, auto-generate weekly reports
- Onboarding Workflows: Automate client and staff onboarding sequences
- Content Pipelines: Draft, schedule, and repurpose content across channels

Pricing: Project-based ($1,500–$10,000+) or Project + Retainer ($300–$2,000/mo)

When someone shows genuine interest and has a real business problem you can solve, output exactly this on its own line:
QUALIFIED_LEAD
LEAD_DATA:{"name":"[their name or Unknown]","business":"[their business type]","need":"[their main automation need]"}

Rules:
- Keep responses to 2–4 sentences max
- Ask only one question at a time
- Be friendly, direct, and use a natural Australian tone
- Never make up services or pricing not listed above`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-12)
        ],
        max_tokens: 350,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond. Please try again.";

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content })
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Connection error. Please try again.' })
    };
  }
};
