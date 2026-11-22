# Socratic Coding Tutor (Rebuild) — Master Spec

A hand-built remake of the Base44 hackathon app. Beginner coders paste a LeetCode-style exercise and are guided Socratically from understanding to working code, never handed the answer early.

**Target user:** beginner coders who struggle to connect what they've learned to actually solving a problem.
**Timeline:** Developers Institute final project. Submission deadline **2026-11-23** (anytime before the 24th), demo day **2026-11-24**.

| Days | Goal | Result |
| --- | --- | --- |
| Sun 15 – Mon 16 | Chunk 1: startup flow, logout link, tie API key to its owner | ✅ |
| Tue 17 – Wed 18 | Chunk 2: intake + silent solve | ✅ |
| Thu 19 – Fri 20 | Chunks 3–4: understanding check, logic walkthrough | ✅ (chunk 4 finished Sun 22) |
| Sat 21 | Chunk 5: implementation | ✅ (Sun 22) |
| Sun 22 | Chunk 6: final reveal | ✅ |
| Mon 23 | Facelift, deploy, end-to-end test, submit | ⏭️ |

Chunk 7 (past exercises) and backlog items move to after demo day.
**Languages supported:** JavaScript and Python (student picks per exercise).

---

## Scope

### MVP
- Accounts (sign up / log in) + user connects his own Claude API key
- Intake: pick JS or Python, paste the exercise
- Silent solve: hidden AI reference solution, created right after intake
- Understanding Check
- Logic Walkthrough (outline, no pseudocode; nudges when a step is too vague; edge cases handled here)
- Implementation (one outline step at a time)
- Final Reveal (student's code vs. AI's solution + explanation of the AI's approach + growth recap)
- Save & resume (built into every stage)
- Past exercises page (chunk 7, after demo)

### Parked (later)
- Exercise cache (reuse solutions for previously seen exercises): the hard part is deciding when two exercises are "the same"
- "Try it in your editor" side-quest during Implementation

### Cut
- Design stage (function signature is usually given in LeetCode-style problems)
- Pseudocode stage
- Separate Test stage (no sandbox)
- Refactor stage (folded into Final Reveal)
- Teacher report / PDF export

---

## Pipeline

1. **Understanding Check:** student explains in his own words what the exercise asks.
2. **Logic Walkthrough:** student builds a step-by-step plan, each step naming what happens and which tool does it. A correct step may come with one edge-case question, skippable unless the exercise requires it. "I'm done" runs a completeness check.
3. **Implementation:** student codes one plan step at a time, starting from an empty editor.
4. **Final Reveal:** his code next to the AI's reference solution, a comparison, the idea behind the reference, and a growth recap.

The same rules apply in stages 1–3: one targeted question per WEAK attempt, hints on request at any time (free), an automatic hint from attempt 3, and at attempt 5 a reveal built on the student's own work.

---

## Architecture

| Layer | Choice |
| --- | --- |
| Frontend | Vite + vanilla TypeScript + HTML/CSS |
| Backend | Node + Express + TypeScript |
| Database | Postgres |
| AI | Claude (Sonnet 5.5), called **only from the server** |

**Key decisions**
- **Claude calls happen server-side** so the hidden reference solution never reaches the browser (DevTools Network tab would expose it). The only route that sends it is `/reveal`, at the final stage.
- **API key lives in the user's browser only, in an `httpOnly` cookie.** The browser sends it automatically; the server uses it per call and never stores it. JavaScript (including injected XSS scripts) can't read it.
- **Session token also lives in an `httpOnly` cookie**, set by the server at login.
- **XSS rule:** AI-generated and user-pasted text is always inserted into the page with `textContent`, never as HTML.

---

## Build plan (feature by feature)

| Chunk | Status |
| --- | --- |
| 1. Accounts + API key | Done |
| 2. Intake + silent solve | Done |
| 3. Understanding Check | Done |
| 4. Logic Walkthrough | Done |
| 5. Implementation | Done |
| 6. Final Reveal | Done |
| 7. Past exercises | After demo |

---

## Chunk notes

### Project setup
- Repo: `client/` (Vite vanilla-ts) + `server/` (Express + TS) + `master-spec.md` + `prompts-v2.md`; `.gitignore` has `node_modules`, `.env`, `server/src/test*.ts`
- Server dev script: `tsx watch --env-file=.env src/index.ts`; `"type": "module"` (imports use `.js` extension)
- `server/.env` holds `DATABASE_URL` (special chars URL-encoded) and `COOKIE_SECRET`
- `server/src/db.ts` exports one shared `pg.Pool`
- `server/db/schema.sql` = record of every table (structure only)

### Chunk 1: Accounts + API key (done)
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

**Endpoints**
- `POST /api/auth/signup`: validation (400) → duplicate check (409) → bcrypt hash → insert → `createSession` → 201 `{ id, username }`
- `POST /api/auth/login`: validation (400) → lookup → `bcrypt.compare` → same 401 for unknown user or wrong password → `createSession` → 200 `{ id, username }`
- `POST /api/auth/logout`: deletes the session row, clears the session and key cookies, 204
- `GET /api/auth/me` (protected): `{ userId }`
- `POST /api/api-key` (protected): verifies the key with `models.list()`, sets the `httpOnly` `apiKey` cookie (7 days) and a signed `apiKeyOwner` cookie
- `GET /api/api-key` (protected): `{ connected: true | false }`, never the key
- `DELETE /api/api-key` (protected): clears the key cookie

**Server pieces**
- `createSession(userId, res)` (sessions.ts): 32-byte hex token, 45-minute expiry, deletes expired rows, sets the `session` cookie
- `requireAuth` (auth.ts): no cookie or no valid session → 401; otherwise sets `res.locals.userId`
- `getOwnedApiKey(req, res)` (apiKey.ts): returns the key only if the signed owner cookie matches the logged-in user; otherwise clears both key cookies and returns null. Every AI route uses it.

**Frontend**
- Single-page app: one `index.html` with `<div id="app">`; each screen is a `render...` function; `showScreen(render)` clears `#app` and draws the new screen.
- Vite dev proxy (`client/vite.config.ts`) forwards `/api` to `localhost:3000`, so cookies just work.
- Shared helpers: `findElement`, `showError`, `showScreen` (app.ts); `postJson` (api.ts); `showNextScreen`, `showExerciseScreen`, `logOut` (navigation.ts); `showMessage`, `setBusy`, `handleAuthErrors` (screenHelpers.ts).
- Startup flow: `GET /api/api-key` → 401 → login; not connected → key screen; connected → `showExerciseScreen` (resume the unfinished exercise's stage, or intake).
- Static markup written by us may use `innerHTML`; anything from the server or the user goes in with `textContent`.

**API key rules**
- Key cookie lasts 7 days (separate from the 45-minute session). Setup screen tells students to log out on shared computers.
- Never put `ANTHROPIC_API_KEY` in the server's `.env`: the SDK would silently fall back to it and bill the developer for students' usage.
- Never paste a real key into a message or a committed file. In the terminal, use `read -s KEY` and `$KEY`.

### Chunk 2: Intake + silent solve (done)
**Table:** `exercises` (id, user_id → users, language, exercise_text, clarification JSONB, function_signature, solution_code, approach_notes, assumptions, test_cases JSONB, self_check_passed BOOLEAN, self_check_notes, current_stage default 'understanding', created_at default NOW(), progress JSONB default '{}').

**Server**
- `prompts/fillPrompt.ts` swaps `{{placeholders}}`; `prompts/shared.ts` holds the shared blocks (TUTOR_VOICE, INPUT_SAFETY, LANGUAGE_RULES, HINT_LADDER); `prompts/intake.ts` holds the four intake templates.
- `askClaude(apiKey, prompt)`: Sonnet 5.5, picks the text block, parses the JSON between the first `{` and last `}`, logs the raw reply if parsing fails. `askClaudeText` returns plain text (used for hints).
- `intakePipeline.ts`: `checkExercise`, `solveExercise`, `writeTestCases`, `checkSolution`, `buildReferenceSolution` (self-check with up to 2 retries; never blocks).
- `POST /api/exercises` (protected): 400 bad input, 403 no owned key, 400 INVALID (Claude's explanation), 200 `{ needsClarification, question }`, 201 `{ id, currentStage, assumptions, exerciseText, progress }` (never the solution), 502 if Claude fails.

**Client**
- Intake screen: language picker, exercise box, hidden clarification section (question, answer, Continue, Edit exercise), loading message with buttons disabled.
- `submitExercise` shared by Start and Continue; 401 → login, 403 → key screen, 201 → Understanding Check.

### Chunk 3: Understanding Check (done)
- `exercises.progress` JSONB holds each stage's record; `progress.understanding` = attempts, gaps, hintsRequested, answerRevealed, finalParaphrase.
- `GET /api/exercises/current`: the newest unfinished exercise (id, currentStage, assumptions, exerciseText, progress), or `{ exercise: null }`.
- `POST /api/exercises/:id/understanding`: WEAK (feedback + next attempt number); SOLID or a 5th-attempt REVEALED both move the stage to `logic`.
- `POST /api/exercises/:id/hint`: escalating hints for every stage via `hintContextForStage` (hintPipeline.ts). Hints are free and never hint at work already done.
- Screen: exercise and assumptions, explanation box, attempt counter (kept after refresh), feedback, hint button.

### Chunk 4: Logic Walkthrough (done)
- `progress.logic` = steps, current (attempts, gaps, hintsRequested), pendingEdgeCase, edgeCases (note + outcome), revealedSteps, history (finished step records), completenessChecks.
- `logicPipeline.ts`: `evaluateLogicStep`, `evaluateEdgeCaseAnswer`, `checkPlanComplete`, `revealLogicStep`, with `formatSteps` and `formatEdgeCases` helpers.
- `exerciseStore.ts`: `loadExerciseAtStage` (only the owner's exercise at the given stage) and `saveProgress` (optionally moves the stage).
- Routes: `/logic/step` (409 while an edge-case question is open); `/logic/edge-case` (answer or skip; required cases can't be skipped; 5 WEAK answers close it as unresolved); `/logic/done` (completeness check; COMPLETE moves to `implementation`).
- Screen: numbered plan, step mode and edge-case mode, Skip, hint, I'm done planning.

### Chunk 5: Implementation (done)
- Students start from an empty editor: step 1's code must include the function line.
- `progress.implementation` = stepIndex, codeSoFar, current, revealedSteps, history.
- `implementationPipeline.ts`: `evaluateStepCode` (returns the updated code so far) and `revealStepCode` (fixes the student's own latest attempt).
- Route: `/implementation` (SOLID or a 5th-attempt reveal adds the step; the last step moves to `reveal`).
- Screen: plan with the current step marked, code so far, code box, hint.

### Chunk 6: Final Reveal (done)
- `revealPipeline.ts`: `summarizeJourney` (totals per stage, including skipped edge cases) and `generateFinalReveal` (comparison, approach_explanation, growth_recap; the recap uses only the journey summary).
- Routes: `/reveal` generates once and saves it in `progress.reveal`, then returns the student's code, the reference solution and the three sections; `/finish` marks the exercise `complete`.
- Screen: both codes, the three sections, Finish and start a new exercise.

### Monday 23 (submission day)
Facelift → deploy → end-to-end test with the demo exercise → submit.

---

## Backlog and open questions (after demo day)
- **Ideas:** "Start a new exercise" button for students with an unfinished exercise; reject nonsense clarification answers instead of proceeding on assumptions; chunk 7 past exercises; stay-signed-in prompt; encrypt the `apiKey` cookie value; exercise cache; the "try it in your editor" side-quest. Add new ideas here as they come up.
- **Prompt polish:** the clarifying question and the completeness pointer sometimes ask two things at once.
- **If invalid JSON recurs:** switch `askClaude` to structured outputs.
- **Design (facelift):** the exercise moves to the side as a reference and the active task takes the center, on every stage; a modern loading animation; consistent styling across screens. Each screen's sections already have their own wrappers with ids, so this is mostly CSS.
- API key setup must explain that a Claude subscription (Pro/Max) does not include API access; the API is billed separately through Console credits.