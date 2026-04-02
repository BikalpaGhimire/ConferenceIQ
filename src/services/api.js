import { getDisambiguationPrompt, getFullProfilePrompt, getScheduleExtractionPrompt, getFollowUpEmailPrompt } from './prompts';
import { parseJsonFromResponse } from '../utils/parseJson';

const CLAUDE_URL = '/api/claude';
const GEMINI_URL = '/api/gemini';
const CACHE_URL = '/api/cache';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';

// --- Provider & BYOK settings ---

export function getProvider() {
  return localStorage.getItem('conferenceiq_provider') || 'gemini';
}

export function setProvider(provider) {
  localStorage.setItem('conferenceiq_provider', provider);
}

function getCustomApiKey() {
  const provider = getProvider();
  return localStorage.getItem(`conferenceiq_${provider}ApiKey`) || '';
}

export function setCustomApiKey(key, provider) {
  const p = provider || getProvider();
  if (key) {
    localStorage.setItem(`conferenceiq_${p}ApiKey`, key);
  } else {
    localStorage.removeItem(`conferenceiq_${p}ApiKey`);
  }
}

export function getStoredApiKey(provider) {
  const p = provider || getProvider();
  return localStorage.getItem(`conferenceiq_${p}ApiKey`) || '';
}

// --- Rate-limit-aware request queue ---
const queue = {
  lastCallTime: 0,
  minSpacing: 1500,
  retryAfter: 0,
};

function getRetryDelay(attempt) {
  const backoffs = [8000, 20000, 40000];
  return backoffs[Math.min(attempt, backoffs.length - 1)];
}

async function waitForSlot() {
  const now = Date.now();

  if (queue.retryAfter > now) {
    const wait = queue.retryAfter - now;
    await new Promise((r) => setTimeout(r, wait));
  }

  const elapsed = Date.now() - queue.lastCallTime;
  if (elapsed < queue.minSpacing) {
    await new Promise((r) => setTimeout(r, queue.minSpacing - elapsed));
  }

  queue.lastCallTime = Date.now();
}

// --- Claude API caller ---

async function callClaude({ system, userMessage, tools = [], maxTokens = 4096, content = null, maxRetries = 3 }) {
  const messages = [{ role: 'user', content: content || userMessage }];
  const body = { model: CLAUDE_MODEL, max_tokens: maxTokens, system, messages };
  if (tools.length > 0) body.tools = tools;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await waitForSlot();

    const headers = { 'Content-Type': 'application/json' };
    const customKey = getCustomApiKey();
    if (customKey) headers['x-custom-api-key'] = customKey;

    const response = await fetch(CLAUDE_URL, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json().catch(() => null);

    if (response.status === 429) {
      const delay = getRetryDelay(attempt);
      console.warn(`Rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${delay / 1000}s...`);
      queue.retryAfter = Date.now() + delay;
      queue.minSpacing = Math.min(queue.minSpacing + 1000, 5000);
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw new Error('Rate limited — please wait a moment and try again.');
    }

    if (queue.minSpacing > 1500) queue.minSpacing = Math.max(queue.minSpacing - 500, 1500);

    if (!response.ok || !data) {
      const msg = data?.error?.message || data?.message || `API error (${response.status})`;
      throw new Error(msg);
    }
    if (!data.content || !Array.isArray(data.content)) throw new Error('Unexpected API response');
    return data;
  }
}

function extractClaudeText(response) {
  if (!response?.content || !Array.isArray(response.content)) return '';
  return response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

// --- Gemini API caller ---

async function callGemini({ system, userMessage, useSearch = false, maxTokens = 4096, content = null, maxRetries = 3 }) {
  const parts = [];

  if (content && Array.isArray(content)) {
    for (const block of content) {
      if (block.type === 'text') {
        parts.push({ text: block.text });
      } else if (block.type === 'image' || block.type === 'document') {
        parts.push({
          inlineData: {
            mimeType: block.source?.media_type || 'application/pdf',
            data: block.source?.data || '',
          },
        });
      }
    }
  } else {
    parts.push({ text: userMessage });
  }

  const body = {
    model: GEMINI_MODEL,
    contents: [{ parts }],
    generationConfig: { maxOutputTokens: maxTokens },
  };

  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await waitForSlot();

    const headers = { 'Content-Type': 'application/json' };
    const customKey = getCustomApiKey();
    if (customKey) headers['x-custom-api-key'] = customKey;

    const response = await fetch(GEMINI_URL, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json().catch(() => null);

    if (response.status === 429) {
      const delay = getRetryDelay(attempt);
      console.warn(`Gemini rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${delay / 1000}s...`);
      queue.retryAfter = Date.now() + delay;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw new Error('Rate limited — please wait a moment and try again.');
    }

    if (!response.ok || !data) {
      const msg = data?.error || `Gemini API error (${response.status})`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }

    return data;
  }
}

function extractGeminiText(response) {
  const candidates = response?.candidates;
  if (!candidates || !candidates[0]?.content?.parts) return '';
  return candidates[0].content.parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join('\n');
}

// --- Unified caller ---

async function callAI({ system, userMessage, useSearch = false, tools = [], maxTokens = 4096, content = null, maxRetries = 3 }) {
  const provider = getProvider();

  if (provider === 'claude') {
    const claudeTools = useSearch
      ? [{ type: 'web_search_20250305', name: 'web_search' }]
      : tools;
    const response = await callClaude({ system, userMessage, tools: claudeTools, maxTokens, content, maxRetries });
    return { text: extractClaudeText(response), raw: response };
  }

  // Default: Gemini
  const response = await callGemini({ system, userMessage, useSearch, maxTokens, content, maxRetries });
  return { text: extractGeminiText(response), raw: response };
}

// --- Server-side cache helpers ---

async function getCachedProfile(name, institution) {
  try {
    const response = await fetch(`${CACHE_URL}?name=${encodeURIComponent(name)}&institution=${encodeURIComponent(institution || '')}`);
    if (response.ok) {
      const data = await response.json();
      if (data.profile) return data.profile;
    }
  } catch {
    // Cache miss
  }
  return null;
}

async function setCachedProfile(name, institution, profile) {
  try {
    await fetch(CACHE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, institution: institution || '', profile }),
    });
  } catch {
    // Non-critical
  }
}

// Step 1: Disambiguate a name (with web search for accurate academic lookup)
export async function disambiguateName(name, hints = {}, myProfile = null) {
  const { system, user } = getDisambiguationPrompt(name, hints, myProfile);
  const { text } = await callAI({
    system,
    userMessage: user,
    useSearch: true,
    maxTokens: 4096,
  });

  const result = parseJsonFromResponse(text);
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object') return [result];
  return [];
}

// Step 2: Generate full profile with server-side cache
export async function generateFullProfile(name, institution = '', myProfile = null) {
  const cached = await getCachedProfile(name, institution);
  if (cached) {
    console.log(`Cache hit for ${name}`);
    return cached;
  }

  const { system, user } = getFullProfilePrompt(name, institution, myProfile);
  const { text } = await callAI({
    system,
    userMessage: user,
    useSearch: true,
    maxTokens: 8192,
    maxRetries: 4,
  });

  const result = parseJsonFromResponse(text);
  if (result) setCachedProfile(name, institution, result);
  return result;
}

// Extract names from uploaded schedule
export async function extractScheduleNames(fileBase64, fileType) {
  const { system, user } = getScheduleExtractionPrompt();

  const content = [
    {
      type: fileType.startsWith('image/') ? 'image' : 'document',
      source: {
        type: 'base64',
        media_type: fileType,
        data: fileBase64.split(',')[1] || fileBase64,
      },
    },
    { type: 'text', text: user },
  ];

  const { text } = await callAI({
    system,
    content,
    userMessage: '',
    maxTokens: 8192,
  });

  return parseJsonFromResponse(text);
}

// Generate follow-up email
export async function generateFollowUpEmail(profile, notes, conference = '', myProfile = null) {
  const { system, user } = getFollowUpEmailPrompt(profile, notes, conference, myProfile);
  const { text } = await callAI({
    system,
    userMessage: user,
    maxTokens: 1024,
  });
  return text;
}
