# Socratic Coding Tutor (Rebuild) — Master Spec

A hand-built remake of the Base44 hackathon app. Beginner coders paste a LeetCode-style exercise and are guided Socratically from understanding to working code, never handed the answer early.

**Target user:** beginner coders who struggle to connect what they've learned to actually solving a problem.
**Timeline:** one week of focused building now (before class resumes); the project later becomes the course capstone, so the MVP can keep growing after this week.
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
| 1. Accounts + API key | In progress |
| 2. Intake + silent solve | Not started |
| 3. Understanding Check | Not started |
| 4. Logic Walkthrough | Not started |
| 5. Implementation | Not started |
| 6. Final Reveal | Not started |
| 7. Past exercises | Not started |

---

## Open questions (parked)
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
- ⏭️ Next: chunk 1 frontend screens

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
