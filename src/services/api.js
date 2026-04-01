import { getDisambiguationPrompt, getQuickCardPrompt, getFullProfilePrompt, getScheduleExtractionPrompt, getFollowUpEmailPrompt } from './prompts';
import { parseJsonFromResponse } from '../utils/parseJson';

const API_URL = '/api/claude';
const MODEL = 'claude-haiku-4-5-20251001';

async function callClaude({ system, userMessage, tools = [], maxTokens = 4096, content = null }) {
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

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    // Anthropic errors: { type: "error", error: { type: "...", message: "..." } }
    const msg = data?.error?.message || data?.message || `API error (${response.status})`;

    if (response.status === 429 || msg.includes('rate limit')) {
      throw new Error('Rate limited — please wait a moment and try again.');
    }

    throw new Error(msg);
  }

  if (!data.content || !Array.isArray(data.content)) {
    throw new Error('Unexpected API response');
  }

  return data;
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

// Step 1: Disambiguate a name
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

// Step 2: Generate Quick Card
export async function generateQuickCard(name, institution = '', myProfile = null) {
  const { system, user } = getQuickCardPrompt(name, institution, myProfile);
  const response = await callClaude({
    system,
    userMessage: user,
    tools: [webSearchTool],
    maxTokens: 4096,
  });

  const text = extractTextFromResponse(response);
  return parseJsonFromResponse(text);
}

// Step 3: Generate full profile (research + media + values + connect + common_ground)
export async function generateFullProfile(name, institution = '', myProfile = null) {
  const { system, user } = getFullProfilePrompt(name, institution, myProfile);
  const response = await callClaude({
    system,
    userMessage: user,
    tools: [webSearchTool],
    maxTokens: 8192,
  });

  const text = extractTextFromResponse(response);
  return parseJsonFromResponse(text);
}

// Generate Quick Card first (fast), then Full Profile (heavy) — sequential to avoid rate limits
export async function generateCompleteProfile(name, institution = '', myProfile = null) {
  const quickCard = await generateQuickCard(name, institution, myProfile).catch(() => null);
  const fullProfile = await generateFullProfile(name, institution, myProfile).catch(() => null);
  return { quickCard, fullProfile };
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
