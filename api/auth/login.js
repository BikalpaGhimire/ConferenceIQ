import { kv } from '@vercel/kv';
import crypto from 'crypto';

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pin } = req.body;

  if (!pin || pin.length !== 6) {
    return res.status(400).json({ error: 'PIN must be 6 digits' });
  }

  const pinHash = hashPin(pin);

  try {
    const userId = await kv.get(`pin:${pinHash}`);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    res.json({
      userId: user.id,
      name: user.name,
      profile: user.profile,
      savedProfiles: user.savedProfiles || [],
      notes: user.notes || {},
      recentSearches: user.recentSearches || [],
      lastView: user.lastView || 'search',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
