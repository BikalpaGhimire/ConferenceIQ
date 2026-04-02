import { kv } from '@vercel/kv';
import crypto from 'crypto';

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
    const userData = {
      id,
      pinHash,
      name: name || '',
      profile: profile || null,
      savedProfiles: [],
      notes: {},
      recentSearches: [],
      lastView: 'search',
      createdAt: Date.now(),
    };

    // Store user by ID
    await kv.set(`user:${id}`, userData);
    // Store pin→userId mapping for login
    await kv.set(`pin:${pinHash}`, id);

    res.json({ userId: id, name: name || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
