# ConferenceIQ — Project Analysis Report

**Date:** 2026-04-01
**Scope:** Build/run check, test coverage, linting, bugs, polishing opportunities, AI prompt consistency plan

---

## 1. Build & Run Status

| Check | Result |
|-------|--------|
| `npm run build` | **PASS** — builds in ~1.4s, output 416 KB JS + 29 KB CSS (gzipped: ~127 KB + 6 KB) |
| PWA generation | **PASS** — SW generated, 6 precached entries (436 KB) |
| Build warnings | None |
| Build errors | None |

The production build is clean and lean. No dead-code warnings, no dependency issues.

---

## 2. Test Suite & Coverage

| Check | Result |
|-------|--------|
| Test files found | **NONE** — no `*.test.*` or `*.spec.*` files exist |
| Test framework | vitest is not in `package.json` dependencies (only resolved ad-hoc via npx) |
| `@vitest/coverage-v8` | **Missing dependency** |
| Coverage | **0%** — no tests to run |

**Verdict:** The project has zero automated tests. This is the single biggest quality gap.

### Recommended test priorities (by impact):
1. `parseJson.js` — unit tests for JSON extraction edge cases (fenced markdown, partial JSON, malformed responses)
2. `prompts.js` — snapshot tests for prompt templates (ensure changes don't silently break output format)
3. `api.js` — integration tests with mocked fetch (verify error handling, rate limit retries, response parsing)
4. `AppContext.jsx` — reducer tests for all action types (state transitions, localStorage sync)
5. `server.js` — API endpoint tests (auth flow, sync, Claude proxy)

---

## 3. Linting & Code Quality

| Check | Result |
|-------|--------|
| ESLint config | **Missing** — no `eslint.config.js` (ESLint v9+ flat config required) |
| ESLint run | **Failed** — cannot run without config |

### Code quality issues found by manual review:

| File | Issue | Severity |
|------|-------|----------|
| `server.js:39` | Empty catch block on migration `try { } catch {}` — swallows real errors | Low |
| `server.js:83` | PIN lookup via hash only — multiple users could theoretically share a PIN hash, `SELECT *` returns first match only | Medium |
| `server.js:20` | DB file path is relative to `__dirname` — if deployed, `conferenceiq.db` sits in the source tree | Low |
| `server.js:166` | Claude proxy forwards `req.body` directly to Anthropic — no validation or sanitization of model/tools fields | Medium |
| `api.js:6` | `MODEL` is hardcoded to `claude-haiku-4-5-20251001` — should be configurable or at least documented | Low |
| `ConnectPanel.jsx:23-46` | Mutual connections computed on every render — no memoization; O(n*m) for large saved profile lists | Low |
| `ConnectPanel.jsx:61` | `navigator.clipboard.writeText()` has no error handling — fails silently in non-HTTPS/non-secure contexts | Low |
| `ProfileView.jsx:60` | Empty catch block `catch { /* keep existing */ }` — silently drops QuickCard refresh errors | Low |
| `AppContext.jsx:232` | `JSON.parse(localStorage...)` outside try/catch — corrupted localStorage crashes the app | Medium |
| `SearchScreen.jsx:65` | Re-search uses current `state.contextHints` not the hints from the original search — may give different disambiguation results | Low |

---

## 4. Feature Review & Polishing Opportunities

### What works well:
- Progressive profile loading (quick card first, then full profile) — excellent UX
- Cached recent searches with instant profile reload — smooth performance
- Briefing Mode — genuinely useful pre-meeting prep tool
- Dark theme design system — consistent and attractive
- PIN-based authentication with server sync — smart for this use case
- Common Ground personalization — adds real value when user has a profile

### Polishing opportunities:

| Area | Issue | Suggestion |
|------|-------|------------|
| **NotesEditor** | Not visible in ProfileView — `showNotes` state exists but NotesEditor is only in ConnectPanel | Move notes to a modal accessible from the QuickCard header or make it tab-accessible |
| **Tab naming** | "Activity" tab renders `ValuesPanel` — naming mismatch is confusing | Rename tab to "Values & Style" or rename component to match |
| **Offline support** | PWA is configured but no offline fallback or cache-first strategy for API calls | Add offline indicator and cached profile viewing when offline |
| **Error recovery** | Errors dismiss on next navigation (`SET_VIEW` clears error) but no retry button | Add "Retry" action to error banners |
| **Empty states** | ResearchPanel/MediaPanel/ValuesPanel have generic empty messages | Add contextual suggestions (e.g., "Try searching with their full institutional affiliation") |
| **Accessibility** | No ARIA labels on icon-only buttons (Refresh, Briefing) | Add `aria-label` attributes |
| **Keyboard navigation** | PinInput has auto-advance but no backspace-to-previous handling visible | Verify backspace UX in PinInput |
| **Loading feedback** | No progress indicator during batch schedule profiling beyond a counter | Add estimated time remaining or progress bar |
| **Profile staleness** | No visual indicator of how old a cached profile is on recent searches | Show "Updated 3 days ago" badge; suggest refresh for stale profiles |
| **Share/Export** | No way to share or export a profile | Add "Copy profile summary" or "Share via link" |
| **Search debounce** | No debounce on search — fast typers may trigger multiple disambiguation calls | Add 300ms debounce (though form submit mitigates this) |
| **Duplicate mutual connections** | `ConnectPanel.jsx:23-46` can add the same person twice (once as shared-collab, once as direct-collab) | Deduplicate by name |

---

## 5. Bugs & Issues

### Confirmed bugs:

1. **localStorage crash risk** (`AppContext.jsx:232-235`)
   ```js
   const notes = JSON.parse(localStorage.getItem('conferenceiq_notes') || '{}');
   ```
   If localStorage contains malformed JSON (corruption, manual editing), this crashes the entire app on startup. Wrap in try/catch.

2. **Duplicate mutual connections** (`ConnectPanel.jsx:23-46`)
   A saved profile that is both a direct collaborator AND shares collaborators with the target will appear twice in the "Mutual Connections" section.

3. **PIN collision vulnerability** (`server.js:83`)
   Login matches by `pin_hash` alone. If two users choose the same PIN, login returns the wrong user's data. Should include a second factor (name, email) or use unique constraint.

4. **API proxy has no request size guard** (`server.js:166`)
   While `express.json({ limit: '50mb' })` caps body size, the proxy blindly forwards any model name, tools config, or system prompt to Anthropic. A malicious client could abuse this to make expensive API calls with different models.

5. **Race condition on profile refresh** (`ProfileView.jsx:40-90`)
   If user clicks "Refresh" twice quickly, both calls run concurrently and the second may overwrite the first's results with stale data. No abort controller or guard.

### Potential issues:

6. **No rate limiting on auth endpoints** — brute-force PIN attack possible (only 1M combinations for 6-digit PIN)
7. **SHA256 without salt** — same PIN always produces same hash; rainbow table vulnerable
8. **No CSRF protection** on POST endpoints
9. **No session/token system** — userId is stored in localStorage with no expiry or validation

---

## 6. AI Prompt Consistency Plan — Academically Viable Framework

### Problem Statement

ConferenceIQ uses AI (Claude) to generate structured profiles across multiple sections (disambiguation, quick card, full profile, briefing, email). Without a systematic prompt framework, the AI outputs will vary in:
- **Tone** (formal vs. casual)
- **Specificity** (vague generalizations vs. cited facts)
- **Hallucination risk** (fabricated publications, incorrect h-index)
- **Structural consistency** (missing fields, inconsistent JSON shape)
- **Bias** (favoring well-known figures, Western-centric framing)

### Proposed Framework: **Structured Academic Intelligence Profiling (SAIP)**

This framework draws from established methodologies in bibliometrics, science communication, and academic profiling (e.g., ORCID standards, Leiden Manifesto for research metrics).

#### 6.1 Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Verifiability** | Every factual claim must be grounded in web-searchable evidence | Prompts must include: "Only include information you can verify via web search. If uncertain, omit." |
| **Approximation labeling** | All quantitative metrics are estimates | All h-index, citation counts, publication counts prefixed with `~` and labeled "approximate" |
| **Recency bias mitigation** | Don't over-weight recent work | Prompt instructs: "Cover the full career arc, not just recent 2 years" |
| **Cultural neutrality** | Avoid Western-centric assumptions | Prompt instructs: "Do not assume cultural norms about communication style. Base observations on publicly available evidence only." |
| **Structured uncertainty** | Express confidence levels | Add confidence indicators to each section (high/medium/low based on source availability) |

#### 6.2 Section-by-Section Prompt Guidelines

##### A. Bio Blurb (Quick Card)
```
GUIDELINES:
- 3 sentences maximum
- Sentence 1: Current role + institution
- Sentence 2: Primary research focus or professional contribution
- Sentence 3: Notable achievement or distinguishing factor
- MUST be factual — no superlatives ("world-leading", "renowned") unless
  verifiable (e.g., specific award, named chair)
- Use present tense for current work, past tense for achievements
```

##### B. Research Impact Snapshot
```
GUIDELINES:
- h-index: Label as "approximate (~)" — source from Google Scholar
  or Semantic Scholar if available, otherwise omit
- Publication count: Round to nearest 10 for >50 publications
- Top fields: Maximum 4, use standard discipline names
  (not niche subtopic names)
- Peak period: Only include if clearly identifiable from
  publication timeline
- NEVER fabricate metrics — if not findable, return 0 or omit
```

##### C. Landmark Papers
```
GUIDELINES:
- Maximum 3 papers
- Selection criteria (in order):
  1. Highest citation count (verified via search)
  2. Most foundational to the person's field contribution
  3. Most recent high-impact work
- Each paper MUST include:
  - Exact title (verified)
  - Journal/venue name
  - Year
  - Approximate citation count (labeled ~)
  - Plain-English summary (1 sentence, accessible to non-specialists)
- URL: Only include if confirmed via search
- NEVER fabricate paper titles or citation counts
```

##### D. Recent Papers
```
GUIDELINES:
- Maximum 5 papers from last 3 years
- Include preprints only if from recognized servers (arXiv, bioRxiv, etc.)
- Sort by recency (newest first)
- Include journal/venue name — no "unpublished" or "in preparation"
```

##### E. Media & Public Presence
```
GUIDELINES:
- News mentions: Only from identifiable, named sources
  (no generic "news article" entries)
- Talks: Include event name and year — no fabricated conference names
- Social profiles: Only include with verified URLs
- Awards: Include year — omit if year unknown
```

##### F. Values & Communication Style
```
GUIDELINES:
- Causes: Must have public evidence (op-ed, advocacy page,
  public statement, organizational membership)
- Communication style: Base on observable evidence
  (interview transcripts, talk recordings, public writing style)
  — not assumptions about personality
- Talking points: Frame as conversation-relevant topics,
  not personality assessments
- "Don't say": Only include genuinely sensitive topics with
  public evidence (e.g., known controversies, contested positions)
  — not speculative
```

##### G. Common Ground
```
GUIDELINES:
- Shared fields: Match at discipline level, not just keyword overlap
- Potential synergies: Must be specific and actionable
  ("Both work on transformer architectures for protein folding")
  not vague ("Both interested in AI")
- Relevance score: 0.0-1.0 based on:
  - Field overlap (0.3 weight)
  - Institutional proximity (0.2 weight)
  - Methodological similarity (0.3 weight)
  - Complementary expertise (0.2 weight)
```

##### H. Conversation Starters
```
GUIDELINES:
- 3 starters, each serving a different purpose:
  1. Technical: References specific recent work or finding
  2. Contextual: References the conference/event context
  3. Personal-professional: References a non-research interest
     or public engagement
- Each must be phrased as an actual opening sentence/question
- Must be specific enough that the person would recognize it
  as informed, not generic
- If searcher profile available: at least 1 starter must
  reference overlap between searcher and target
```

##### I. Follow-Up Email
```
GUIDELINES:
- Under 150 words
- Structure: greeting → specific reference to meeting context →
  one shared interest → proposed next step → sign-off
- Tone: warm but professional (not overly formal, not casual)
- Must reference at least one specific detail from the
  person's profile
- If notes provided: incorporate naturally, don't just append
- Sign with searcher's name and affiliation if available
```

#### 6.3 Prompt Template Architecture

Implement a centralized prompt configuration system:

```javascript
// src/services/promptConfig.js

export const PROMPT_GUIDELINES = {
  global: {
    verification: "Only include information verifiable via web search. If uncertain, omit the field entirely rather than guessing.",
    metrics: "All quantitative metrics (h-index, citations, publication counts) are approximate. Always prefix with '~' and label as approximate.",
    fabrication: "NEVER fabricate: paper titles, citation counts, institutional affiliations, email addresses, or URLs. If not found via search, omit.",
    tone: "Professional, specific, factual. No superlatives unless backed by verifiable evidence (awards, rankings, named positions).",
    bias: "Do not assume cultural norms. Base all observations on publicly available evidence only.",
    confidence: "If data is sparse (few search results), note 'Limited public information available' in relevant sections.",
  },

  sections: {
    bio_blurb: { /* section-specific rules */ },
    research_impact: { /* section-specific rules */ },
    // ... etc
  }
};
```

#### 6.4 Quality Assurance Mechanisms

| Mechanism | Purpose | Implementation |
|-----------|---------|----------------|
| **JSON schema validation** | Ensure structural consistency | Validate AI responses against Zod/JSON schemas before rendering |
| **Hallucination flags** | Detect likely fabrications | Flag papers with no URL, h-index without source, suspiciously round numbers |
| **Confidence indicators** | Show data reliability | Add visual indicators (green/yellow/red) based on number of search results found |
| **User feedback loop** | Improve over time | Allow users to flag inaccurate information per field |
| **Prompt versioning** | Track prompt changes | Version prompts in source control; log which prompt version generated each profile |
| **A/B testing** | Optimize prompt effectiveness | Store prompt version with each profile; compare quality across versions |

#### 6.5 Academic Viability

This framework aligns with:
- **Leiden Manifesto (2015):** Research metrics should be transparent, contextual, and approximate
- **DORA (San Francisco Declaration):** Don't over-rely on single metrics like h-index
- **ORCID standards:** Structured representation of academic identity
- **ACM Code of Ethics:** Accuracy and honesty in information presentation
- **Responsible AI principles:** Transparency about AI-generated content and limitations

**Recommended additions for academic rigor:**
1. Add a visible "AI-generated profile" disclaimer on all profiles
2. Show data sources (which search results informed the profile)
3. Allow manual corrections that persist across refreshes
4. Timestamp each section independently (research data may be fresher than media data)
5. Add export to standard academic formats (BibTeX for papers, ORCID-compatible JSON)

---

## 7. Summary & Priority Actions

### Critical (fix now):
1. **Wrap localStorage reads in try/catch** — app crashes on corrupt data
2. **Add salt to PIN hashing** — basic security requirement
3. **Fix duplicate mutual connections** — visible UI bug

### High (address soon):
4. Add ESLint config (flat config for v9+) and fix any issues
5. Add rate limiting to auth endpoints (prevent PIN brute-force)
6. Add request validation to Claude proxy endpoint
7. Set up vitest + basic test suite for critical paths

### Medium (polish):
8. Rename "Activity" tab → "Values & Style" (or vice versa)
9. Add ARIA labels to icon-only buttons
10. Add abort controller to profile refresh to prevent race conditions
11. Implement the SAIP prompt framework for consistent AI output
12. Add offline indicator for PWA
13. Add profile staleness indicator on recent searches

### Low (nice to have):
14. Add profile sharing/export feature
15. Add user feedback mechanism for profile accuracy
16. Add confidence indicators to profile sections
17. Memoize mutual connections computation
18. Add prompt versioning system

---

*Report generated by automated analysis. Manual verification recommended for all findings.*
