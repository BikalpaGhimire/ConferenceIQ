export function getDisambiguationPrompt(name, hints = {}) {
  const contextParts = [];
  if (hints.field) contextParts.push(`Field: ${hints.field}`);
  if (hints.institution) contextParts.push(`Institution: ${hints.institution}`);
  if (hints.conference) contextParts.push(`Conference: ${hints.conference}`);
  if (hints.country) contextParts.push(`Country/Region: ${hints.country}`);
  const context = contextParts.length > 0 ? contextParts.join('. ') : 'No additional context provided';

  return {
    system: `You are an academic/professional person finder. Given a name and optional context, search the web to find matching professionals. Return ONLY valid JSON — no markdown fences, no explanation.`,
    user: `Find professionals named "${name}".
Context: ${context}.

Search the web thoroughly. Return a JSON array of up to 5 candidates:
[{
  "full_name": "",
  "title": "",
  "institution": "",
  "department": "",
  "field": "",
  "h_index_approx": null,
  "photo_url": "",
  "distinguishing_detail": "",
  "confidence_score": 0.0,
  "profile_url": ""
}]

Order by relevance/confidence. If only one strong match exists, return just that one. Return ONLY the JSON array.`,
  };
}

export function getQuickCardPrompt(name, institution = '') {
  return {
    system: `You are ConferenceIQ, an intelligence briefing tool for professional networking. Build a concise, warm profile for networking purposes. Be specific — reference actual work, dates, and facts. Never fabricate. Return ONLY valid JSON — no markdown fences, no explanation.`,
    user: `Build a quick networking card for: ${name}${institution ? ` at ${institution}` : ''}.

Search the web for their current role, bio, education, research interests, and recent notable work.

Return JSON:
{
  "full_name": "",
  "title": "",
  "institution": "",
  "department": "",
  "location": "",
  "photo_url": "",
  "bio_blurb": "(3-5 sentences, warm and informative — who they are, why they matter, what they're known for right now)",
  "education": [{"degree": "", "institution": "", "year": ""}],
  "research_tags": ["tag1", "tag2"],
  "conversation_starters": [
    "(specific icebreaker referencing their actual recent work — not generic)",
    "(another specific one)",
    "(a third one)"
  ]
}

Return ONLY the JSON object.`,
  };
}

export function getFullProfilePrompt(name, institution = '') {
  return {
    system: `You are ConferenceIQ, an intelligence briefing tool for professional networking. Build a comprehensive profile. Be specific — reference actual papers, talks, dates, and facts. Never fabricate. If information isn't findable, omit it or note it. Label all metrics as approximate. Return ONLY valid JSON — no markdown fences, no explanation.`,
    user: `Build a comprehensive networking profile for: ${name}${institution ? ` at ${institution}` : ''}.

Search extensively for: publications, news mentions, talks, awards, social media presence, organizational memberships, advocacy work, and any other publicly available information.

Return JSON:
{
  "research": {
    "impact_snapshot": {
      "approx_publications": 0,
      "h_index_approx": 0,
      "top_fields": [],
      "peak_period": ""
    },
    "landmark_papers": [{
      "title": "",
      "journal": "",
      "year": "",
      "approx_citations": 0,
      "plain_english_summary": "",
      "url": ""
    }],
    "recent_papers": [{
      "title": "",
      "journal": "",
      "year": "",
      "url": ""
    }],
    "research_evolution": "(narrative paragraph about how their interests have shifted)",
    "key_collaborators": [{"name": "", "institution": "", "joint_papers_approx": 0}]
  },
  "media": {
    "news_mentions": [{"source": "", "headline": "", "date": "", "url": ""}],
    "talks": [{"event": "", "title": "", "year": "", "url": ""}],
    "social_profiles": [{"platform": "", "handle": "", "followers_approx": 0, "url": "", "note": ""}],
    "awards": [{"name": "", "year": ""}]
  },
  "values_and_style": {
    "causes_and_advocacy": [{"topic": "", "evidence": ""}],
    "professional_roles": [],
    "communication_style": "(paragraph inferred from public presence)",
    "talking_points": ["topic they'd enjoy discussing"]
  },
  "contact": {
    "email": "",
    "lab_website": "",
    "office": "",
    "google_scholar_url": "",
    "linkedin_url": "",
    "personal_website": ""
  }
}

Return ONLY the JSON object. Omit sections where no data is found rather than using empty strings.`,
  };
}

export function getScheduleExtractionPrompt() {
  return {
    system: `You are a conference schedule parser. Extract all speaker/presenter names from the uploaded document. Group them by session or time block. Return ONLY valid JSON — no markdown fences, no explanation.`,
    user: `Extract all speaker and presenter names from this conference schedule/program.

Return JSON:
{
  "conference_name": "",
  "sessions": [
    {
      "time": "",
      "title": "",
      "speakers": [
        {
          "name": "",
          "affiliation": "",
          "talk_title": ""
        }
      ]
    }
  ]
}

Return ONLY the JSON object. Include every name you can find.`,
  };
}

export function getFollowUpEmailPrompt(profile, notes, conference = '') {
  const name = profile?.quick_card?.full_name || 'the person';
  const institution = profile?.quick_card?.institution || '';
  const tags = profile?.quick_card?.research_tags?.join(', ') || '';
  const recentWork = profile?.research?.recent_papers
    ?.map((p) => p.title)
    .join('; ') || '';

  return {
    system: `Draft a warm, specific follow-up email for after a conference meeting. Reference specific details from the conversation (provided in notes) and from the person's work. Keep it concise (under 150 words), professional but not stiff, and include a clear next step. Return only the email text — no subject line prefix, no explanation.`,
    user: `Draft a follow-up email to ${name} (${institution}).
${conference ? `Context: Met at ${conference}.` : ''}
My notes: ${notes || 'No notes provided'}
Their recent work: ${recentWork || 'Not available'}
Their interests: ${tags || 'Not available'}

Write only the email body.`,
  };
}
