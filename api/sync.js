import { createClient } from '@vercel/kv';

function getKV() {
  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, profile, savedProfiles, notes, recentSearches, lastView } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const kv = getKV();

    const raw = await kv.get(`user:${userId}`);
    if (!raw) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (profile !== undefined) user.profile = profile ? { quick_card: profile.quick_card, _savedAt: profile._savedAt } : profile;
    if (savedProfiles !== undefined) user.savedProfiles = savedProfiles;
    if (notes !== undefined) user.notes = notes;
    if (recentSearches !== undefined) user.recentSearches = recentSearches;
    if (lastView !== undefined) user.lastView = lastView;
    user.updatedAt = Date.now();

    await kv.set(`user:${userId}`, JSON.stringify(user));
    res.json({ ok: true });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
}
