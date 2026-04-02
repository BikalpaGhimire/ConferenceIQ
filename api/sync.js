import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, profile, savedProfiles, notes, recentSearches, lastView } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (profile !== undefined) user.profile = profile;
    if (savedProfiles !== undefined) user.savedProfiles = savedProfiles;
    if (notes !== undefined) user.notes = notes;
    if (recentSearches !== undefined) user.recentSearches = recentSearches;
    if (lastView !== undefined) user.lastView = lastView;
    user.updatedAt = Date.now();

    await kv.set(`user:${userId}`, user);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
