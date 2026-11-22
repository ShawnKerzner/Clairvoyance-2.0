# Socratic Coding Tutor (Rebuild) — Master Spec

A hand-built remake of the Base44 hackathon app. Beginner coders paste a LeetCode-style exercise and are guided Socratically from understanding to working code, never handed the answer early.

**Target user:** beginner coders who struggle to connect what they've learned to actually solving a problem.
**Timeline:** Developers Institute final project. Submission deadline **2026-11-23**, demo day **2026-11-24**.

| Days | Goal |
| --- | --- |
| Sun 15 – Mon 16 | Finish chunk 1: startup flow, logout link, tie API key to its owner |
| Tue 17 – Wed 18 | Chunk 2: intake + silent solve (start from v1 prompts) |
| Thu 19 – Fri 20 | Chunks 3–4: understanding check, logic walkthrough |
| Sat 21 | Chunk 5: implementation |
| Sun 22 | Chunk 6: final reveal + basic styling |
| Mon 23 | Deploy, end-to-end test, submit |

Chunk 7 (past exercises) and backlog items move to after demo day unless there's time.
**Languages supported:** JavaScript and Python (student picks per exercise).

---

## Scope

### MVP
- Accounts (sign up / log in) + user connects his own Claude API key
- Intake: pick JS or Python, paste the exercise
- Silent solve: hidden AI reference solution, created right after intake
- Understanding Check
- Logic Walkthrough (outline, no pseudocode; nudges when a step is too vague; edge cases handled here)
- Implementation (one outline step at a time, each followed by an optional "try it in VS Code" side-quest)
- Final Reveal (student's code vs. AI's solution + explanation of the AI's approach)
- Save & resume (built into every stage)
- Past exercises page

### Parked (later)
- Exercise cache (reuse solutions for previously seen exercises) — hard part is deciding when two exercises are "the same"

### Cut
- Design stage (function signature is usually given in LeetCode-style problems)
- Pseudocode stage
- Separate Test stage (no sandbox; replaced by the optional side-quest)
- Refactor stage (folded into Final Reveal)
- Teacher report / PDF export

---

## Pipeline

1. **Understanding Check** — student explains in his own words what the exercise asks.
2. **Logic Walkthrough** — student builds a step-by-step outline. Vague steps get a nudge to go deeper. After a correct step, he's asked how he'd handle a relevant edge case; skippable unless the exercise explicitly requires it. *(Details to design in chunk 4.)*
3. **Implementation** — student codes one outline step at a time and submits each. After each step, the AI offers an optional side-quest: the step's code plus a debug/print line (given by the AI) to try in VS Code.
4. **Final Reveal** — side-by-side with the AI's reference solution, plus why the AI solved it that way.

---

## Architecture

| Layer | Choice |
| --- | --- |
| Frontend | Vite + vanilla TypeScript + HTML/CSS |
| Backend | Node + Express + TypeScript |
| Database | Postgres |
| AI | Claude, called **only from the server** |

**Key decisions**
- **Claude calls happen server-side** so the hidden reference solution never reaches the browser (DevTools Network tab would expose it).
- **API key lives in the user's browser only, in an `httpOnly` cookie** (changed from `localStorage`). The browser sends it automatically; the server uses it per call and never stores it. JavaScript (including injected XSS scripts) can't read it. Trade-offs: re-enter on a new device; the page asks the server whether a key is connected.
- **Session token also lives in an `httpOnly` cookie**, set by the server at login.
- **XSS rule (still applies):** AI-generated and user-pasted text is always inserted into the page as plain text, never as HTML.

---

## Build plan (feature by feature)

Each chunk goes through frontend, backend and database together, so there's a working app end to end early.

1. **Accounts + API key** — sign up / log in, then a beginner-friendly API key setup
2. **Intake + silent solve** — language + exercise; server creates the hidden reference solution
3. **Understanding Check**
4. **Logic Walkthrough**
5. **Implementation**
6. **Final Reveal**
7. **Past exercises**

| Chunk | Status |
| --- | --- |
| 1. Accounts + API key | Done |
| 2. Intake + silent solve | Done |
| 3. Understanding Check | Not started |
| 4. Logic Walkthrough | Not started |
| 5. Implementation | Not started |
| 6. Final Reveal | Not started |
| 7. Past exercises | Not started |

---

## Open questions (parked)
- **Ideas backlog (after demo day):** "Start a new exercise" button for students with an unfinished exercise; reject nonsense clarification answers instead of proceeding on assumptions; chunk 7 past exercises; stay-signed-in prompt; cookie encryption; exercise cache. Add new ideas here as they come up.
- Backlog hardening: encrypt the `apiKey` cookie value with a server secret so the raw key isn't visible in DevTools.
- AI prompts (chunks 2–6): v2 prompts written and approved, see `prompts-v2.md`. Decisions: no function-design step, interactive-input exercises become plain functions, no Refactor stage, one clarification round.
- Frontend design and UX pass after the core pipeline works: the goal is an excellent experience for students. Discuss direction when we get there.
  - Layout idea for every stage: the exercise moves to the side as a reference, and the active task (clarification, understanding, logic, code) takes the center. Keep each screen's sections in their own wrappers with ids, so this is a CSS-only change.
  - Replace the placeholder loading text with a modern loading animation.
  - Prompt polish: the clarifying question sometimes asks two things at once.
- Exact edge-case flow in the Logic Walkthrough (chunk 4)
- Making API key setup intuitive for beginners (chunk 1). Must explain that a Claude subscription (Pro/Max) does not include API access; the API is billed separately through Console credits.

---

## Chunk notes
*(Filled in as each chunk is built: data model, endpoints, decisions, gotchas.)*

### Project setup (done)
- Repo: `client/` (Vite vanilla-ts) + `server/` (Express + TS) + `master-spec.md`; `.gitignore` has `node_modules`, `.env`
- Server dev script: `tsx watch --env-file=.env src/index.ts`; `"type": "module"` (imports use `.js` extension)
- `server/.env` holds `DATABASE_URL` (special chars in password URL-encoded, e.g. `@` → `%40`)
- `server/src/db.ts` exports one shared `pg.Pool`
- `server/db/schema.sql` = record of every table (structure only, no queries)
- Test routes: `GET /api/health`, `GET /api/db-test`

### Chunk 1: Accounts + API key (in progress)
**Auth approach:** server-side sessions stored in Postgres (chosen over JWT for DB practice and easy logout). The server trusts only tokens it issued, never user ids sent by the browser.

**Tables**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(60) NOT NULL   -- bcrypt hashes are always 60 chars
);

CREATE TABLE sessions (
  user_id INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(64) PRIMARY KEY,         -- 32 random bytes as hex
  expires_at TIMESTAMPTZ NOT NULL
);
```
- Naming: login tokens live in `sessions`; exercise attempts will be a separate `exercises` table.

**Endpoints**
- `POST /api/auth/signup`: create an account
- `POST /api/auth/login`: check credentials, issue a session token (`httpOnly` cookie)
- `POST /api/auth/logout`: delete the session row and clear the cookie
- `GET /api/auth/me` (protected): returns `{ userId }` for the logged-in student
- `POST /api/api-key`: key in the body; server sets it as an `httpOnly` cookie
- `GET /api/api-key`: returns only `{ connected: true | false }`, never the key
- `DELETE /api/api-key`: clears the key cookie
- Sensitive data (passwords, tokens, API keys) goes in the body or headers, never the URL.

**Session expiry**
- Sessions last 45 minutes. Every request that uses a session must check `expires_at`.
- Planned feature: a "stay signed in?" prompt shown before expiry that extends the session (needs its own endpoint). **Backlogged: build after chunk 7.**
- Cleanup: `createSession` deletes expired rows (`DELETE FROM sessions WHERE expires_at < NOW()`) before inserting, so it runs on every login and signup.

**Progress**
- ✅ `createSession(userId, res)` in `server/src/sessions.ts`: 32-byte hex token, `expires_at` = now + 45 min, inserts session row, sets `session` cookie (`httpOnly`, expires with the session)
- ✅ `POST /api/auth/signup`: validation (400) → duplicate check (409) → bcrypt hash → insert `RETURNING id, username` → `createSession` → 201 `{ id, username }`
- ✅ `POST /api/auth/login`: validation (400) → lookup by username → `bcrypt.compare` → same 401 "Username or password is incorrect." for unknown user or wrong password → `createSession` → 200 `{ id, username }`
- ✅ `POST /api/auth/logout`: if a token cookie exists, delete its row; always clear the cookie and respond 204 (also 204 with no cookie)
- ✅ `cookie-parser` registered; token read from `req.cookies.session`
- ✅ `requireAuth` middleware in `server/src/auth.ts`: no cookie → 401; no session row matching the token with `expires_at > NOW()` → 401; otherwise sets `res.locals.userId` and calls `next()`. Attached per route: `app.get(path, requireAuth, handler)`
- ✅ `GET /api/auth/me` (protected): 200 `{ userId }`, used by the frontend to check who's logged in
- ✅ `POST /api/api-key` (protected): missing key → 400; verify with `client.models.list()` (free, no tokens) inside try/catch, invalid → 400 with an actionable message; set `apiKey` cookie (`httpOnly`, 7 days); 200 `{ connected: true }`
- ✅ `GET /api/api-key` (protected): 200 `{ connected: true | false }` based on whether the `apiKey` cookie exists
- ✅ `DELETE /api/api-key` (protected): clears the `apiKey` cookie, 204
- ✅ Logout also clears the `apiKey` cookie (protects shared computers)
- ✅ Frontend: login, signup and API key screens working end to end; shared helpers `findElement`, `showError` (app.ts), `postJson` (api.ts); `showNextScreen` and `logOut` (navigation.ts); startup flow in main.ts uses `showNextScreen`; placeholder exercise intake screen with logout
- ✅ API key tied to its owner: signed `apiKeyOwner` cookie (cookie-parser + `COOKIE_SECRET`), checked at the point of use by `getOwnedApiKey` (server/src/apiKey.ts); a mismatched, missing or tampered owner clears both key cookies. `GET /api/api-key` uses it. Every future AI route must use it too.
- ✅ **Chunk 1 complete**

### Chunk 2: Intake + silent solve (done)
**Table:** `exercises` (id, user_id → users, language, exercise_text, clarification JSONB, function_signature, solution_code, approach_notes, assumptions, test_cases JSONB, self_check_passed BOOLEAN, self_check_notes, current_stage default 'understanding', created_at default NOW()).

**Server**
- `prompts/fillPrompt.ts` swaps `{{placeholders}}`; `prompts/shared.ts` holds the shared blocks; `prompts/intake.ts` holds the four intake templates.
- `askClaude(apiKey, prompt)`: Sonnet 5.5, picks the text block, keeps the first `{` to last `}`, parses JSON, throws clear errors.
- `intakePipeline.ts`: `checkExercise`, `solveExercise`, `writeTestCases`, `checkSolution`, and `buildReferenceSolution` (self-check with up to 2 retries using fixContext; never blocks).
- `POST /api/exercises` (protected): 400 bad input, 403 no owned key, 400 INVALID (Claude's explanation), 200 `{ needsClarification, question }`, 201 `{ id, currentStage, assumptions }` (never the solution), 502 if Claude fails.

**Client**
- Intake screen: language picker, exercise box, hidden clarification section (question, answer, Continue, Edit exercise), loading message with buttons disabled.
- `submitExercise` shared by Start and Continue; 401 → login, 403 → key screen, 201 → Understanding Check placeholder.

**Known gap:** refreshing on the Understanding Check goes back to intake, because `showNextScreen` doesn't check for an unfinished exercise yet. First task of chunk 3.

- ⏭️ Next: chunk 3 (Understanding Check)

### Status as of 2026-11-22 evening
✅ **All stages are coded and tested end to end:** intake → Understanding Check → Logic Walkthrough → Implementation → Final Reveal → Finish (back to intake).

**Chunk 4, Logic Walkthrough:** `progress.logic` (steps, current, pendingEdgeCase, edgeCases, revealedSteps, history, completenessChecks). Routes: `/logic/step`, `/logic/edge-case` (answer or skip; required can't be skipped; 5 WEAK → unresolved), `/logic/done` (completeness check → implementation). Screen: numbered plan, step / edge-case modes, skip, hint, I'm done.

**Chunk 5, Implementation:** students start from an empty editor (step 1 includes the function line). `progress.implementation` (stepIndex, codeSoFar, current, revealedSteps, history). Route: `/implementation` (SOLID or 5th-attempt reveal adds the step; last step → reveal). Screen: plan with the current step marked, code so far, code box, hint.

**Chunk 6, Final Reveal:** `generateFinalReveal` (comparison, approach explanation, growth recap built only from `summarizeJourney`). Route `/reveal` generates once and saves it in `progress.reveal`; `/finish` marks the exercise complete. Screen: both codes, three sections, Finish button.

**Shared:** `exerciseStore.ts` (loadExerciseAtStage, saveProgress), `screenHelpers.ts` (showMessage, setBusy, handleAuthErrors), hint route works for every stage via `hintContextForStage`.

**Monday 23 (submission day):** facelift → deploy → end-to-end test with the demo exercise → submit.

### Chunk 3: Understanding Check (done)
- `exercises.progress` JSONB tracks each stage's attempts, gaps, hintsRequested, answerRevealed and final text.
- `GET /api/exercises/current` returns the newest unfinished exercise (id, currentStage, assumptions, exerciseText); `showExerciseScreen` resumes the right stage on load.
- `POST /api/exercises/:id/understanding`: WEAK (feedback + next attempt number), SOLID or a 5th-attempt REVEALED both move the stage to `logic`.
- `POST /api/exercises/:id/hint`: escalating hints, free (no attempts used). Hints use `askClaudeText` (plain text), because Claude sometimes skipped the JSON wrapper.
- Screen: explanation box, feedback, attempt counter, hint button; placeholder Logic Walkthrough screen.
- **To finish:** retest the hint button, SOLID → Logic, refresh on Logic.
- **Polish before demo:** attempt counter resets to 1 after a refresh (send the attempt count with the exercise); feedback can mention the reference function name (add "never mention the reference signature's name or parameters" to EVALUATE_PARAPHRASE).
- **If invalid JSON recurs elsewhere:** switch `askClaude` to structured outputs.

**Frontend (chunk 1)**
- Single-page app: one `index.html` with `<div id="app">`; each screen is a `render...` function; `showScreen(render)` clears `#app` (`innerHTML = ""`) and draws the new screen.
- Vite dev proxy (`client/vite.config.ts`) forwards `/api` to `localhost:3000`, so the browser stays same-origin (no CORS, cookies just work). Frontend code uses relative paths like `/api/auth/login`.
- Startup flow on every page load: `GET /api/auth/me` → 401 → Login; 200 → `GET /api/api-key` → `connected: false` → API key setup; `true` → exercise page (placeholder until chunk 2). After login/signup, jump to the key check.
- Valid session = stay logged in (normal website behavior), including after refresh or reopening the tab.
- Login screen: heading, red error area (top of form, empty at first), username input, password input (`type="password"`), submit button, "Sign up" link.
- Static markup written by us may use `innerHTML`; anything from the server or the user goes in with `textContent`.

**API key rules**
- Key cookie lasts 7 days (separate from the 45-minute session). Setup screen tells students to log out on shared computers.
- Never put `ANTHROPIC_API_KEY` in the server's `.env`. The Anthropic SDK silently falls back to that variable when it gets no key, which would bill the developer for students' usage.
- Always check the `apiKey` cookie exists before creating an Anthropic client.
