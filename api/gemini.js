export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-custom-api-key'] || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'No Gemini API key available. Set your own key in Settings.' });
  }

  const { model, contents, systemInstruction, tools, generationConfig } = req.body;
  const geminiModel = model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

  const body = { contents };
  if (systemInstruction) body.systemInstruction = systemInstruction;
  if (tools) body.tools = tools;
  if (generationConfig) body.generationConfig = generationConfig;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `Gemini API error (${response.status})`;
      return res.status(response.status).json({ error: msg });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
