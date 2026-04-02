import { kv } from '@vercel/kv';

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function cacheKey(name, institution) {
  return `cache:${name.toLowerCase().trim()}|${(institution || '').toLowerCase().trim()}`;
}

export default async function handler(req, res) {
  // GET — read from cache
  if (req.method === 'GET') {
    const { name, institution } = req.query;
    if (!name) return res.status(400).json({ error: 'name required' });

    try {
      const key = cacheKey(name, institution);
      const cached = await kv.get(key);
      if (cached) {
        return res.json({ profile: cached, cachedAt: Date.now() });
      }
    } catch {
      // Cache miss
    }
    return res.json({ profile: null });
  }

  // POST — write to cache
  if (req.method === 'POST') {
    const { name, institution, profile } = req.body;
    if (!name || !profile) return res.status(400).json({ error: 'name and profile required' });

    try {
      const key = cacheKey(name, institution);
      await kv.set(key, profile, { ex: CACHE_TTL_SECONDS });
      return res.json({ ok: true });
    } catch {
      // Cache write failure is non-critical
      return res.json({ ok: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
