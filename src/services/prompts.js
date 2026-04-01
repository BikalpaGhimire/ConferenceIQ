// Compact summary of the user's profile for injection into prompts
function getMyProfileSummary(myProfile) {
  if (!myProfile?.quick_card) return '';
  const qc = myProfile.quick_card;
  const parts = [];
  if (qc.full_name) parts.push(`Name: ${qc.full_name}`);
  if (qc.title) parts.push(`Role: ${qc.title}`);
  if (qc.institution) parts.push(`Institution: ${qc.institution}`);
  if (qc.research_tags?.length) parts.push(`Interests: ${qc.research_tags.join(', ')}`);
  if (myProfile._lookingFor) parts.push(`Looking for: ${myProfile._lookingFor}`);
  return parts.join('. ');
}

export function getDisambiguationPrompt(name, hints = {}, myProfile = null) {
  const contextParts = [];
  if (hints.field) contextParts.push(`Field: ${hints.field}`);
  if (hints.institution) contextParts.push(`Institution: ${hints.institution}`);
  if (hints.conference) contextParts.push(`Conference: ${hints.conference}`);
  if (hints.country) contextParts.push(`Country/Region: ${hints.country}`);
  const context = contextParts.length > 0 ? contextParts.join('. ') : 'No additional context provided';

  const userContext = myProfile ? `\nThe person searching works in: ${getMyProfileSummary(myProfile)}. Prioritize candidates in related fields when ranking.` : '';

  return {
    system: `You are an academic/professional person finder. Given a name and optional context, search the web to find matching professionals. Return ONLY valid JSON — no markdown fences, no explanation.`,
    user: `Find professionals named "${name}".
Context: ${context}.${userContext}

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

export function getQuickCardPrompt(name, institution = '', myProfile = null) {
  const userContext = myProfile
    ? `\n\nIMPORTANT: The person using this tool is: ${getMyProfileSummary(myProfile)}.
Generate conversation starters that specifically reference overlap between the searcher's work and this person's work. Make the starters personalized — not generic icebreakers, but things that show the searcher has done homework AND has relevant expertise.`
    : '';

  return {
    system: `You are ConferenceIQ, an intelligence briefing tool for professional networking. Build a concise, warm profile for networking purposes. Be specific — reference actual work, dates, and facts. Never fabricate. Return ONLY valid JSON — no markdown fences, no explanation.`,
    user: `Build a quick networking card for: ${name}${institution ? ` at ${institution}` : ''}.

Search the web for their current role, bio, education, research interests, and recent notable work.${userContext}

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
    "(specific icebreaker referencing their actual recent work${myProfile ? ' AND how it connects to the searcher' : ''} — not generic)",
    "(another specific one)",
    "(a third one)"
  ]
}

Return ONLY the JSON object.`,
  };
}

export function getFullProfilePrompt(name, institution = '', myProfile = null) {
  const userContext = myProfile
    ? `\n\nThe person using this tool is: ${getMyProfileSummary(myProfile)}.
Based on this, also generate a "common_ground" section showing how the searcher and this person connect.`
    : '';

  const commonGroundSchema = myProfile
    ? `,
  "common_ground": {
    "shared_fields": ["fields both people work in"],
    "shared_collaborators": ["names of people both have worked with, if any"],
    "potential_synergies": ["1-3 specific reasons these two people should connect, referencing actual work"],
    "relevance_score": 0.0
  }`
    : '';

  return {
    system: `You are ConferenceIQ, an intelligence briefing tool for professional networking. Build a comprehensive profile. Be specific — reference actual papers, talks, dates, and facts. Never fabricate. If information isn't findable, omit it or note it. Label all metrics as approximate. Return ONLY valid JSON — no markdown fences, no explanation.`,
    user: `Build a comprehensive networking profile for: ${name}${institution ? ` at ${institution}` : ''}.

Search extensively for: publications, news mentions, talks, awards, social media presence, organizational memberships, advocacy work, and any other publicly available information.${userContext}

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
    "talking_points": ["topic they'd enjoy discussing"],
    "dont_say": ["topics to avoid — sensitive, controversial, or potentially awkward subjects. Empty array if nothing found."]
  },
  "contact": {
    "email": "",
    "lab_website": "",
    "office": "",
    "google_scholar_url": "",
    "linkedin_url": "",
    "personal_website": ""
  }${commonGroundSchema}
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

export function getFollowUpEmailPrompt(profile, notes, conference = '', myProfile = null) {
  const name = profile?.quick_card?.full_name || 'the person';
  const institution = profile?.quick_card?.institution || '';
  const tags = profile?.quick_card?.research_tags?.join(', ') || '';
  const recentWork = profile?.research?.recent_papers
    ?.map((p) => p.title)
    .join('; ') || '';
  const userName = myProfile?.quick_card?.full_name || '';
  const userRole = myProfile?.quick_card?.title || '';
  const userInst = myProfile?.quick_card?.institution || '';

  const fromContext = userName
    ? `\nWrite FROM the perspective of ${userName}${userRole ? `, ${userRole}` : ''}${userInst ? ` at ${userInst}` : ''}. Sign the email with their name.`
    : '';

  return {
    system: `Draft a warm, specific follow-up email for after a conference meeting. Reference specific details from the conversation (provided in notes) and from the person's work. Keep it concise (under 150 words), professional but not stiff, and include a clear next step. Return only the email text — no subject line prefix, no explanation.${fromContext}`,
    user: `Draft a follow-up email to ${name} (${institution}).
${conference ? `Context: Met at ${conference}.` : ''}
My notes: ${notes || 'No notes provided'}
Their recent work: ${recentWork || 'Not available'}
Their interests: ${tags || 'Not available'}

Write only the email body.`,
  };
}
