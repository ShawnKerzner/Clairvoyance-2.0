# Clairvoyance 2.0

A Socratic coding tutor for beginner programmers. Instead of handing out answers, Clairvoyance guides students through solving a coding exercise themselves: explaining the problem, planning their logic step by step, and writing the code one step at a time. The AI's reference solution is only revealed at the very end.

**Live app:** https://clairvoyance-ojkd.onrender.com/

> Built as my final project for the Developers Institute full stack bootcamp.

---

## How it works

1. **Intake:** the student pastes an exercise and picks JavaScript or Python. If the exercise is vague, the tutor asks one clarifying question first.
2. **Silent solve:** the server has Claude write a hidden reference solution and check it against test cases. It never reaches the browser.
3. **Understand:** the student explains the exercise in their own words.
4. **Plan:** the student builds a step-by-step plan in plain English, naming the tool for each step. The tutor asks about relevant edge cases along the way, and checks the whole plan for completeness at the end.
5. **Code:** the student writes the code for one plan step at a time, building on their code so far.
6. **Review:** the student's code is shown next to the reference solution, with an honest comparison, the idea behind the reference, and a recap of their journey.

Throughout every stage:
- **5 attempts per step.** Weak answers get one targeted question (never "try again"). After 5 attempts the tutor reveals the step so the student is never stuck.
- **Free hints** that escalate gently and never use up attempts.
- **Progress is saved**, so a student can log out and resume exactly where they left off, or exit an exercise and start a new one.

Students bring their own Anthropic API key, so the app never pays for their usage.

---

## Design

A calm, focused night-sky theme that plays on the name: a drifting starfield with constellations, a soft aurora, frosted-glass cards and the Fraunces serif. A "spell" animation charges up through the stages, from a calm glow at intake to a full burst of light, sparks and constellations when the student reaches the Review.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | TypeScript, HTML, CSS, Vite (single-page app, no framework), canvas animations |
| Backend | Node.js, Express 5, TypeScript (run with `tsx`) |
| Database | PostgreSQL (`pg`), progress stored as JSONB per stage |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`), all calls server-side |
| Auth | bcrypt (`bcryptjs`), server-side sessions, `httpOnly` cookies (`cookie-parser`) |
| Hosting | Render (web service + Postgres) |

---

## Security practices

- Parameterized SQL queries everywhere (no SQL injection).
- Passwords hashed with bcrypt and never returned in responses.
- Session tokens and API keys in `httpOnly` cookies, unreadable by page JavaScript. The API key is never stored in the database, and a signed owner cookie ties it to the account that saved it.
- All AI calls made server-side, so hidden solutions never reach the browser before the Review.
- Every exercise route checks that the exercise belongs to the logged-in user.
- Prompt-injection guards in every prompt: student input is treated as data, never as instructions.
- User and AI text rendered with `textContent`, never as HTML (XSS protection).
- Secrets kept out of URLs and source control (`.env` is git-ignored).

---

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create an account and log in |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | End the session and clear cookies |
| GET | `/api/auth/me` | The logged-in user |
| POST / GET / DELETE | `/api/api-key` | Verify and save, check, or remove the user's Anthropic key |
| POST | `/api/exercises` | Start an exercise (may return a clarifying question) |
| GET | `/api/exercises/current` | The user's in-progress exercise, to resume |
| POST | `/api/exercises/:id/understanding` | Check the student's explanation |
| POST | `/api/exercises/:id/logic/step` | Check one plan step |
| POST | `/api/exercises/:id/logic/edge-case` | Answer or skip an edge-case question |
| POST | `/api/exercises/:id/logic/done` | Check the whole plan for completeness |
| POST | `/api/exercises/:id/implementation` | Check the code for one step |
| POST | `/api/exercises/:id/hint` | A hint for the current stage |
| POST | `/api/exercises/:id/reveal` | Generate the final Review |
| POST | `/api/exercises/:id/finish` | Mark the exercise complete |
| POST | `/api/exercises/:id/exit` | Leave the exercise early |

All routes except signup and login require a valid session.

---

## Project structure

```
clairvoyance-2.0/
├── client/                    # Vite frontend
│   ├── index.html
│   ├── vite.config.ts         # dev proxy: /api → localhost:3000
│   └── src/
│       ├── main.ts            # startup: sky + first screen
│       ├── app.ts             # #app, showScreen, findElement
│       ├── navigation.ts      # routes the user to the right screen
│       ├── screenHelpers.ts   # shared screen pieces (stage row, attempts, checking spell)
│       ├── sky.ts             # starfield, aurora, constellations
│       ├── nova.ts            # the charging "spell" animation
│       ├── celebrate.ts       # the Review celebration
│       ├── style.css
│       └── screens/           # login, signup, apiKey, intake,
│                              # understanding, logic, implementation, reveal
└── server/                    # Express backend
    ├── db/schema.sql          # database tables
    └── src/
        ├── index.ts           # routes (also serves the built client in production)
        ├── *Pipeline.ts       # one AI pipeline per stage
        ├── prompts/           # the tutor prompts
        ├── exerciseStore.ts   # load and save progress
        ├── sessions.ts, auth.ts, apiKey.ts
        └── db.ts
```

---

## Running locally

**Requirements:** Node.js 22+ and PostgreSQL.

1. **Create the database.** Create a Postgres database called `clairvoyance` and run `server/db/schema.sql` against it.
2. **Configure the server.** Create `server/.env`:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/clairvoyance
   COOKIE_SECRET=any-long-random-string
   ```
   Do **not** add an Anthropic API key here. Users supply their own key in the app.
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

To use the app you'll need an Anthropic API key from the [Claude Console](https://platform.claude.com/). A Claude Pro/Max subscription does not include API access; the API is billed separately.

### Production build

Render runs:
- **Build:** `cd client && npm install && npm run build && cd ../server && npm install`
- **Start:** `cd server && npm start`

The Express server serves `client/dist`, so the site and API share one origin.

---

## What's next

- Past exercises page to revisit finished work
- Syntax highlighting in the code views
- Exercise cache to reuse reference solutions for repeated exercises
- "Stay signed in?" prompt before a session expires
