# CLAUDE.md

## Behavior
- Always proceed with the best approach without asking questions
- Do not stop to confirm — just execute
- If multiple approaches exist, pick the best one and go
- If something fails, debug and fix it autonomously
- Do not summarize what you did at the end — the diff speaks for itself
- Iterate until fully satisfied with the result or stopped by token limits
- Never pause to check in mid-task — keep going until done
- Test, review, and refine your own work before presenting it
- If you hit an error, fix it and keep moving — do not stop to report it
- Treat every task as "finish it completely" unless told otherwise

## Project: ConferenceIQ
- Real-time intelligence briefing tool for conference networking
- Turns a name (or conference schedule) into a rich, actionable profile

## Tech Stack
- Frontend: Vite + React 18 + Tailwind CSS 4
- API Proxy: Express.js (minimal, CORS proxy for Anthropic API)
- AI: Claude Sonnet via Anthropic API with web_search tool
- Storage: localStorage + IndexedDB (via idb-keyval)
- PWA: vite-plugin-pwa
- Icons: Lucide React
- Animations: Framer Motion
- Fonts: DM Serif Display (headlines) + Source Sans 3 (body) via Google Fonts
- Routing: React Router v6
- API key stored in .env (server-side only, never exposed to browser)

## Design System
- Dark theme: navy #0f1729, cards #1e2a3a, accent amber #f0a500, teal #00d4aa
- Mobile-first, PWA-installable
- Progressive loading with skeleton shimmer states
- "Bloomberg Terminal meets Apple Notes" aesthetic

## Quality Checks (run before considering a task done)
- Lint the code (npx eslint src/)
- Build succeeds (npm run build)
- Fix all errors and warnings — do not leave broken code
- Review your own code for edge cases, error handling, and correctness
- Verify the feature works end-to-end, not just that it compiles
- If building an app: start it, hit key endpoints/flows, confirm they work
- Repeat the cycle (fix → test → review) until everything passes clean

## Code Style
- Write clean, readable JSX
- Follow React best practices (hooks, functional components)
- Prefer simple, direct solutions over clever abstractions
- No unnecessary comments or docstrings — only where logic is non-obvious
- Use Tailwind utility classes, avoid custom CSS unless necessary

## Git
- Use conventional commit messages (feat:, fix:, refactor:, etc.)
- Keep commits focused and atomic

## Key Implementation Notes
- API calls must include tools: [{ type: "web_search_20250305", name: "web_search" }]
- Profile generation is CHUNKED: (a) disambiguation, (b) quick card, (c) research, (d) media+values+connect
- JSON parsing must strip markdown fences from Claude responses
- Rate limit batch mode: 1-2s spacing between API calls
- PDF/image upload: base64 encode via FileReader.readAsDataURL()
- Always label h-index and citation counts as approximate (~)
