import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'dist')));

// --- Database Setup ---
const db = new Database(join(__dirname, 'conferenceiq.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    name TEXT,
    profile_json TEXT,
    saved_profiles_json TEXT DEFAULT '[]',
    notes_json TEXT DEFAULT '{}',
    recent_searches_json TEXT DEFAULT '[]',
    last_view TEXT DEFAULT 'search',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
`);

// Migration: add last_view column if missing
try { db.exec('ALTER TABLE users ADD COLUMN last_view TEXT DEFAULT "search"'); } catch {};

// --- Profile Cache Table (7-day TTL) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS profile_cache (
    cache_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    institution TEXT DEFAULT '',
    profile_json TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
`);

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

function generateUserId() {
  return crypto.randomBytes(8).toString('hex');
}

// --- Auth Endpoints ---

// Register: create account with PIN
app.post('/api/auth/register', (req, res) => {
  const { pin, name, profile } = req.body;

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
  }

  const id = generateUserId();
  const pinHash = hashPin(pin);

  try {
    db.prepare(`
      INSERT INTO users (id, pin_hash, name, profile_json)
      VALUES (?, ?, ?, ?)
    `).run(id, pinHash, name || '', profile ? JSON.stringify(profile) : null);

    res.json({ userId: id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login: verify PIN
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;

  if (!pin || pin.length !== 6) {
    return res.status(400).json({ error: 'PIN must be 6 digits' });
  }

  const pinHash = hashPin(pin);
  const user = db.prepare('SELECT * FROM users WHERE pin_hash = ?').get(pinHash);

  if (!user) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  res.json({
    userId: user.id,
    name: user.name,
    profile: user.profile_json ? JSON.parse(user.profile_json) : null,
    savedProfiles: JSON.parse(user.saved_profiles_json || '[]'),
    notes: JSON.parse(user.notes_json || '{}'),
    recentSearches: JSON.parse(user.recent_searches_json || '[]'),
    lastView: user.last_view || 'search',
  });
});

// --- Data Sync Endpoints ---

// Save user data (profile, saved profiles, notes, recent searches)
app.post('/api/sync', (req, res) => {
  const { userId, profile, savedProfiles, notes, recentSearches, lastView } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updates = [];
  const params = [];

  if (profile !== undefined) {
    updates.push('profile_json = ?');
    params.push(JSON.stringify(profile));
  }
  if (savedProfiles !== undefined) {
    updates.push('saved_profiles_json = ?');
    params.push(JSON.stringify(savedProfiles));
  }
  if (notes !== undefined) {
    updates.push('notes_json = ?');
    params.push(JSON.stringify(notes));
  }
  if (recentSearches !== undefined) {
    updates.push('recent_searches_json = ?');
    params.push(JSON.stringify(recentSearches));
  }
  if (lastView !== undefined) {
    updates.push('last_view = ?');
    params.push(lastView);
  }

  if (updates.length === 0) {
    return res.json({ ok: true });
  }

  updates.push('updated_at = unixepoch()');
  params.push(userId);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// --- Profile Cache Endpoints ---

// GET /api/cache?name=...&institution=...
app.get('/api/cache', (req, res) => {
  const { name, institution } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });

  const cacheKey = `${name.toLowerCase().trim()}|${(institution || '').toLowerCase().trim()}`;
  const row = db.prepare(
    'SELECT profile_json, created_at FROM profile_cache WHERE cache_key = ? AND created_at > unixepoch() - ?'
  ).get(cacheKey, CACHE_TTL_SECONDS);

  if (row) {
    return res.json({ profile: JSON.parse(row.profile_json), cachedAt: row.created_at });
  }
  res.json({ profile: null });
});

// POST /api/cache — store a profile
app.post('/api/cache', (req, res) => {
  const { name, institution, profile } = req.body;
  if (!name || !profile) return res.status(400).json({ error: 'name and profile required' });

  const cacheKey = `${name.toLowerCase().trim()}|${(institution || '').toLowerCase().trim()}`;
  db.prepare(`
    INSERT OR REPLACE INTO profile_cache (cache_key, name, institution, profile_json, created_at)
    VALUES (?, ?, ?, ?, unixepoch())
  `).run(cacheKey, name, institution || '', JSON.stringify(profile));

  res.json({ ok: true });
});

// --- Claude API Proxy ---
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ConferenceIQ running on http://localhost:${PORT}`);
});
