function getMyProfileSummary(myProfile) {
  if (!myProfile?.quick_card) return '';
  const qc = myProfile.quick_card;
  const parts = [];
  if (qc.full_name) parts.push(qc.full_name);
  if (qc.title) parts.push(qc.title);
  if (qc.institution) parts.push(qc.institution);
  if (qc.research_tags?.length) parts.push(`interests: ${qc.research_tags.slice(0, 4).join(', ')}`);
  return parts.join(', ');
}

export function getDisambiguationPrompt(name, hints = {}, myProfile = null) {
  const ctx = [];
  if (hints.field) ctx.push(`Field: ${hints.field}`);
  if (hints.institution) ctx.push(`Institution: ${hints.institution}`);
  if (hints.conference) ctx.push(`Conference: ${hints.conference}`);
  if (hints.country) ctx.push(`Region: ${hints.country}`);

  const userCtx = myProfile ? ` Searcher: ${getMyProfileSummary(myProfile)}. Prioritize related fields. Make conversation starters reference overlap.` : '';

  return {
    system: 'Find matching professionals and build a quick networking card for each. Be specific, never fabricate. Return ONLY valid JSON array, no fences.',
    user: `Find "${name}". ${ctx.join('. ')}.${userCtx}
Return: [{"full_name":"","title":"","institution":"","department":"","field":"","location":"","h_index_approx":null,"distinguishing_detail":"","confidence_score":0.0,"bio_blurb":"(2-3 sentences)","education":[{"degree":"","institution":"","year":""}],"research_tags":[],"conversation_starters":["specific","specific","specific"]}]
Max 5. Only JSON.`,
  };
}

export function getFullProfilePrompt(name, institution = '', myProfile = null) {
  const userCtx = myProfile ? ` Searcher: ${getMyProfileSummary(myProfile)}.` : '';
  const cgBlock = myProfile
    ? ',"common_ground":{"shared_fields":[],"shared_collaborators":[],"potential_synergies":["why connect"],"relevance_score":0.0}'
    : '';

  return {
    system: 'Build comprehensive profile for networking. Be specific, never fabricate. Omit empty sections. Return ONLY valid JSON, no fences.',
    user: `Full profile: ${name}${institution ? ` at ${institution}` : ''}.${userCtx}
Return: {"research":{"impact_snapshot":{"approx_publications":0,"h_index_approx":0,"top_fields":[],"peak_period":""},"landmark_papers":[{"title":"","journal":"","year":"","approx_citations":0,"plain_english_summary":"","url":""}],"recent_papers":[{"title":"","journal":"","year":"","url":""}],"research_evolution":"","key_collaborators":[{"name":"","institution":"","joint_papers_approx":0}]},"media":{"news_mentions":[{"source":"","headline":"","date":"","url":""}],"talks":[{"event":"","title":"","year":""}],"social_profiles":[{"platform":"","handle":"","url":""}],"awards":[{"name":"","year":""}]},"values_and_style":{"causes_and_advocacy":[{"topic":"","evidence":""}],"professional_roles":[],"communication_style":"","talking_points":[],"dont_say":[]},"contact":{"email":"","lab_website":"","google_scholar_url":"","linkedin_url":""}${cgBlock}}
Only JSON.`,
  };
}

export function getScheduleExtractionPrompt() {
  return {
    system: 'Extract speaker names from conference schedule. Return ONLY valid JSON, no fences.',
    user: `Extract names. Return: {"conference_name":"","sessions":[{"time":"","title":"","speakers":[{"name":"","affiliation":"","talk_title":""}]}]}
Only JSON.`,
  };
}

export function getFollowUpEmailPrompt(profile, notes, conference = '', myProfile = null) {
  const name = profile?.quick_card?.full_name || 'them';
  const inst = profile?.quick_card?.institution || '';
  const tags = profile?.quick_card?.research_tags?.slice(0, 3).join(', ') || '';
  const userName = myProfile?.quick_card?.full_name || '';
  const from = userName ? ` Write FROM ${userName}${myProfile?.quick_card?.institution ? ` at ${myProfile.quick_card.institution}` : ''}, sign with their name.` : '';

  return {
    system: `Draft warm follow-up email, under 150 words, professional but not stiff.${from} Return only email text.`,
    user: `To: ${name} (${inst}).${conference ? ` Met at ${conference}.` : ''} Notes: ${notes || 'none'}. Interests: ${tags || 'n/a'}. Email body only.`,
  };
}
