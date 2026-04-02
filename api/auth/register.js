import { createClient } from '@vercel/kv';
import crypto from 'crypto';

function getKV() {
  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pin, name, profile } = req.body;

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
  }

  const id = crypto.randomBytes(8).toString('hex');
  const pinHash = hashPin(pin);

  try {
    const kv = getKV();

    // Store minimal user data (avoid storing huge profile objects)
    const userData = {
      id,
      pinHash,
      name: name || '',
      profile: profile ? { quick_card: profile.quick_card, _savedAt: profile._savedAt } : null,
      savedProfiles: [],
      notes: {},
      recentSearches: [],
      lastView: 'search',
      createdAt: Date.now(),
    };

    await kv.set(`user:${id}`, JSON.stringify(userData));
    await kv.set(`pin:${pinHash}`, id);

    res.json({ userId: id, name: name || '' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
}
