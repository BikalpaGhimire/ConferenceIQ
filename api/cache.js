import { createClient } from '@vercel/kv';

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getKV() {
  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

function cacheKey(name, institution) {
  return `cache:${name.toLowerCase().trim()}|${(institution || '').toLowerCase().trim()}`;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { name, institution } = req.query;
    if (!name) return res.status(400).json({ error: 'name required' });

    try {
      const kv = getKV();
      const key = cacheKey(name, institution);
      const raw = await kv.get(key);
      if (raw) {
        const cached = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return res.json({ profile: cached, cachedAt: Date.now() });
      }
    } catch {
      // Cache miss
    }
    return res.json({ profile: null });
  }

  if (req.method === 'POST') {
    const { name, institution, profile } = req.body;
    if (!name || !profile) return res.status(400).json({ error: 'name and profile required' });

    try {
      const kv = getKV();
      const key = cacheKey(name, institution);
      await kv.set(key, JSON.stringify(profile), { ex: CACHE_TTL_SECONDS });
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
