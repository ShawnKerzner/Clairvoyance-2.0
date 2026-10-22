# Clairvoyance 2.0

A Socratic coding tutor for beginner programmers. Instead of handing out answers, Clairvoyance guides students through solving a coding exercise themselves — explaining the problem, outlining their logic step by step, and implementing it one piece at a time — and only reveals the AI's reference solution at the end.

> **Status:** in active development. Authentication and API key management are complete on the backend; the frontend is being built screen by screen.

---

## How it works

1. **Intake:** the student pastes a LeetCode-style exercise and picks JavaScript or Python.
2. **Silent solve:** the server has Claude produce a hidden reference solution. It never reaches the browser.
3. **Understanding check:** the student explains the problem in their own words.
4. **Logic walkthrough:** the student builds a step-by-step outline, with nudges when a step is vague and optional edge-case questions.
5. **Implementation:** the student codes one outline step at a time, each with an optional "try it in your editor" side-quest.
6. **Final reveal:** the student's code is shown next to the AI's solution, with an explanation of the AI's approach.

Students bring their own Anthropic API key, so the app never pays for their usage.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | TypeScript, HTML, CSS, Vite (single-page app) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (`pg`) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Auth | bcrypt (`bcryptjs`), server-side sessions, `httpOnly` cookies (`cookie-parser`) |

---

## What's built so far

### Backend
- **Signup:** input validation, duplicate username check, bcrypt password hashing, automatic login.
- **Login:** username lookup and `bcrypt.compare`, with the same generic error for an unknown user or a wrong password, so usernames can't be discovered.
- **Logout:** deletes the session row and clears the session and API key cookies.
- **Sessions:** 32-byte random tokens stored in Postgres with a 45-minute expiry, sent as `httpOnly` cookies. Expired sessions are cleaned up on every login and signup.
- **`requireAuth` middleware:** protects private routes by verifying the session token against the database and exposing the user's id to the route.
- **API key management:** the user's Anthropic key is verified with a zero-cost API call, then stored only in a 7-day `httpOnly` cookie, never in the database.

### Frontend
- Vite + TypeScript single-page app with a `showScreen` function that swaps screens inside one `#app` container.
- Screens organized one per file (`screens/login.ts`, `screens/signup.ts`), with shared helpers in `app.ts`.
- Generic, type-safe `findElement<T>()` helper for DOM lookups with clear error messages.
- Login screen markup, form submit handling without page reloads, and navigation to the signup screen.
- Vite dev proxy forwards `/api` requests to Express, so the frontend and backend share one origin in development.

### Security practices
- Parameterized SQL queries everywhere (no SQL injection).
- Passwords hashed with bcrypt and never returned in responses.
- Session tokens and API keys in `httpOnly` cookies, unreadable by page JavaScript.
- All AI calls made server-side, so hidden solutions never reach the browser.
- Secrets kept out of URLs and source control (`.env` is git-ignored).
- Server-provided and user-provided text rendered with `textContent`, never as HTML (XSS protection).

---

## API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | – | Create an account and log in. Returns `201 { id, username }` |
| POST | `/api/auth/login` | – | Log in. Returns `200 { id, username }` |
| POST | `/api/auth/logout` | – | End the session and clear cookies. Returns `204` |
| GET | `/api/auth/me` | ✔ | Returns `{ userId }` for the logged-in user |
| POST | `/api/api-key` | ✔ | Verify and save the user's Anthropic key. Returns `{ connected: true }` |
| GET | `/api/api-key` | ✔ | Returns `{ connected: true \| false }` (never the key itself) |
| DELETE | `/api/api-key` | ✔ | Remove the saved key. Returns `204` |

---

## Project structure

```
clairvoyance-2.0/
├── client/                 # Vite frontend
│   ├── index.html
│   ├── vite.config.ts      # dev proxy: /api → localhost:3000
│   └── src/
│       ├── main.ts         # app startup
│       ├── app.ts          # #app element, showScreen, findElement
│       ├── style.css
│       └── screens/
│           ├── login.ts
│           └── signup.ts
└── server/                 # Express backend
    ├── db/
    │   └── schema.sql      # database tables
    └── src/
        ├── index.ts        # routes
        ├── db.ts           # shared Postgres connection pool
        ├── sessions.ts     # createSession helper
        └── auth.ts         # requireAuth middleware
```

---

## Running locally

**Requirements:** Node.js and PostgreSQL.

1. **Create the database.** Create a Postgres database called `clairvoyance` and run `server/db/schema.sql` against it.
2. **Configure the server.** Create `server/.env`:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/clairvoyance
   ```
   URL-encode any special characters in the password (for example `@` → `%40`).
   Do **not** add an `ANTHROPIC_API_KEY` here. Users supply their own key in the app.
3. **Start the backend.**
   ```bash
   cd server
   npm install
   npm run dev
   ```
4. **Start the frontend** in a second terminal.
   ```bash
   cd client
   npm install
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173).

To use the AI features, you'll need an Anthropic API key from the [Claude Console](https://platform.claude.com/). A Claude Pro/Max subscription does not include API access; the API is billed separately.

---

## Roadmap

### Chunk 1: Accounts + API key (in progress)
- [x] Signup, login, logout, sessions, `requireAuth`
- [x] API key endpoints
- [x] Login screen markup and form handling
- [ ] Login form calls the API and shows errors
- [ ] Signup screen
- [ ] API key setup screen (beginner-friendly, explains subscription vs. API billing)
- [ ] Startup flow: check session → check key → route to the right screen

### Upcoming
- [ ] **Chunk 2:** Exercise intake + silent solve (hidden reference solution)
- [ ] **Chunk 3:** Understanding check
- [ ] **Chunk 4:** Logic walkthrough (with edge-case questions)
- [ ] **Chunk 5:** Implementation, step by step
- [ ] **Chunk 6:** Final reveal
- [ ] **Chunk 7:** Past exercises page (save and resume)

### Backlog
- [ ] "Stay signed in?" prompt that extends a session before it expires
- [ ] Exercise cache: reuse solutions for exercises the app has already seen
- [ ] Additional cookie hardening (`sameSite`, `secure` in production)
- [ ] Final refactor and edge-case pass across the whole app
