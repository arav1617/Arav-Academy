// Vercel serverless function: /api/tutor
// Keeps the Anthropic API key on the server — never expose it in index.html.
// Set ANTHROPIC_API_KEY as an environment variable in your Vercel project settings.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { question, studentAge, level } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question' });
  }

  const systemPrompt = `You are a warm, patient, encouraging math and physics tutor speaking ` +
    `out loud to a ${studentAge || 14}-year-old student who is at the ${level || 'Grade 9'} level, ` +
    `working toward the IB Diploma. Keep answers short (2-4 sentences) since they will be read aloud ` +
    `by text-to-speech — no bullet points, no LaTeX, no markdown, just plain spoken sentences. ` +
    `Explain the "why," not just the "what." If the question is unclear, ask one short clarifying ` +
    `question instead of guessing. Stay strictly on math and physics topics appropriate for a young teenager.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'AI service error', detail: errText });
    }

    const data = await response.json();
    const answer = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(' ')
      .trim();

    return res.status(200).json({ answer: answer || "Sorry, I didn't catch that — could you try again?" });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
