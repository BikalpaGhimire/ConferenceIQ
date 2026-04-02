import { getDisambiguationPrompt, getFullProfilePrompt, getScheduleExtractionPrompt, getFollowUpEmailPrompt } from './prompts';
import { parseJsonFromResponse } from '../utils/parseJson';

const API_URL = '/api/claude';
const CACHE_URL = '/api/cache';
const MODEL = 'claude-haiku-4-5-20251001';

// --- Rate-limit-aware request queue ---
const queue = {
  lastCallTime: 0,
  minSpacing: 2000,
  retryAfter: 0,
};

function getRetryDelay(headers, attempt) {
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

async function callClaude({ system, userMessage, tools = [], maxTokens = 4096, content = null, maxRetries = 3 }) {
  const messages = [
    {
      role: 'user',
      content: content || userMessage,
    },
  ];

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  };

  if (tools.length > 0) {
    body.tools = tools;
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await waitForSlot();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (response.status === 429) {
      const delay = getRetryDelay(response.headers, attempt);
      console.warn(`Rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${delay / 1000}s...`);
      queue.retryAfter = Date.now() + delay;
      queue.minSpacing = Math.min(queue.minSpacing + 1000, 5000);

      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw new Error('Rate limited — please wait a moment and try again.');
    }

    if (queue.minSpacing > 2000) {
      queue.minSpacing = Math.max(queue.minSpacing - 500, 2000);
    }

    if (!response.ok || !data) {
      const msg = data?.error?.message || data?.message || `API error (${response.status})`;
      throw new Error(msg);
    }

    if (!data.content || !Array.isArray(data.content)) {
      throw new Error('Unexpected API response');
    }

    return data;
  }
}

function extractTextFromResponse(response) {
  if (!response?.content || !Array.isArray(response.content)) return '';

  const textParts = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text);

  if (textParts.length > 0) {
    return textParts.join('\n');
  }

  return '';
}

const webSearchTool = {
  type: 'web_search_20250305',
  name: 'web_search',
};

// --- Server-side cache helpers ---

async function getCachedProfile(name, institution) {
  try {
    const response = await fetch(`${CACHE_URL}?name=${encodeURIComponent(name)}&institution=${encodeURIComponent(institution || '')}`);
    if (response.ok) {
      const data = await response.json();
      if (data.profile) return data.profile;
    }
  } catch {
    // Cache miss — proceed to API
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
    // Cache write failure is non-critical
  }
}

// Step 1: Disambiguate a name (with web_search for accurate academic lookup)
export async function disambiguateName(name, hints = {}, myProfile = null) {
  const { system, user } = getDisambiguationPrompt(name, hints, myProfile);
  const response = await callClaude({
    system,
    userMessage: user,
    tools: [webSearchTool],
    maxTokens: 4096,
  });

  const text = extractTextFromResponse(response);
  const result = parseJsonFromResponse(text);

  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object') return [result];
  return [];
}

// Step 2: Generate full profile with server-side cache
// Checks cache first — only calls Claude API on cache miss
export async function generateFullProfile(name, institution = '', myProfile = null) {
  // Check server cache first
  const cached = await getCachedProfile(name, institution);
  if (cached) {
    console.log(`Cache hit for ${name}`);
    return cached;
  }

  const { system, user } = getFullProfilePrompt(name, institution, myProfile);
  const response = await callClaude({
    system,
    userMessage: user,
    tools: [webSearchTool],
    maxTokens: 8192,
    maxRetries: 4,
  });

  const text = extractTextFromResponse(response);
  const result = parseJsonFromResponse(text);

  // Cache the result server-side
  if (result) {
    setCachedProfile(name, institution, result);
  }

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
    {
      type: 'text',
      text: user,
    },
  ];

  const response = await callClaude({
    system,
    content,
    userMessage: '',
    maxTokens: 8192,
  });

  const text = extractTextFromResponse(response);
  return parseJsonFromResponse(text);
}

// Generate follow-up email
export async function generateFollowUpEmail(profile, notes, conference = '', myProfile = null) {
  const { system, user } = getFollowUpEmailPrompt(profile, notes, conference, myProfile);
  const response = await callClaude({
    system,
    userMessage: user,
    maxTokens: 1024,
  });

  return extractTextFromResponse(response);
}
