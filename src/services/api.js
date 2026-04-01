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

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || err.message || `API error (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();

  // Handle tool_use responses: when stop_reason is "tool_use", the model used
  // web_search but hasn't produced a final text response yet. For server-side
  // tools like web_search, Anthropic handles the tool execution internally
  // and returns the final text. But if we somehow get end_turn with no text,
  // handle gracefully.
  if (!data?.content || !Array.isArray(data.content)) {
    throw new Error('Unexpected API response format');
  }

  return data;
}

function extractTextFromResponse(response) {
  if (!response?.content || !Array.isArray(response.content)) return '';

  // Extract text blocks (primary content)
  const textParts = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text);

  if (textParts.length > 0) {
    return textParts.join('\n');
  }

  // If no text blocks found, check for tool results that might contain text
  // (shouldn't happen with server-side web_search, but defensive)
  return '';
}

const webSearchTool = {
  type: 'web_search_20250305',
  name: 'web_search',
};

// Step 1: Disambiguate a name
export async function disambiguateName(name, hints = {}) {
  const { system, user } = getDisambiguationPrompt(name, hints);
  const response = await callClaude({
    system,
    userMessage: user,
    tools: [webSearchTool],
    maxTokens: 4096,
  });

  const text = extractTextFromResponse(response);
  const result = parseJsonFromResponse(text);

  // Ensure we always return an array
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object') return [result];
  return [];
}

// Step 2: Generate Quick Card
export async function generateQuickCard(name, institution = '') {
  const { system, user } = getQuickCardPrompt(name, institution);
  const response = await callClaude({
    system,
    userMessage: user,
    tools: [webSearchTool],
    maxTokens: 4096,
  });

  const text = extractTextFromResponse(response);
  return parseJsonFromResponse(text);
}

// Step 3: Generate full profile (research + media + values + connect)
export async function generateFullProfile(name, institution = '') {
  const { system, user } = getFullProfilePrompt(name, institution);
  const response = await callClaude({
    system,
    userMessage: user,
    tools: [webSearchTool],
    maxTokens: 8192,
  });

  const text = extractTextFromResponse(response);
  return parseJsonFromResponse(text);
}

// Generate Quick Card + Full Profile in parallel for speed
export async function generateCompleteProfile(name, institution = '') {
  const [quickCard, fullProfile] = await Promise.all([
    generateQuickCard(name, institution).catch(() => null),
    generateFullProfile(name, institution).catch(() => null),
  ]);
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
export async function generateFollowUpEmail(profile, notes, conference = '') {
  const { system, user } = getFollowUpEmailPrompt(profile, notes, conference);
  const response = await callClaude({
    system,
    userMessage: user,
    maxTokens: 1024,
  });

  return extractTextFromResponse(response);
}
