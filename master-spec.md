# Socratic Coding Tutor (Rebuild) — Master Spec

A hand-built remake of the Base44 hackathon app. Beginner coders paste a LeetCode-style exercise and are guided Socratically from understanding to working code, never handed the answer early.

**Target user:** beginner coders who struggle to connect what they've learned to actually solving a problem.
**Timeline:** ~1 week.
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
- **API key lives in the user's browser only** (`localStorage`), sent with each request, used by the server for that call and never stored. Server holds nothing sensitive; trade-off is re-entering the key on a new device.
- **XSS rule:** because the key sits in `localStorage`, AI-generated and user-pasted text is always inserted into the page as plain text, never as HTML.

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
| 1. Accounts + API key | Not started |
| 2. Intake + silent solve | Not started |
| 3. Understanding Check | Not started |
| 4. Logic Walkthrough | Not started |
| 5. Implementation | Not started |
| 6. Final Reveal | Not started |
| 7. Past exercises | Not started |

---

## Open questions (parked)
- Exact edge-case flow in the Logic Walkthrough (chunk 4)
- Making API key setup intuitive for beginners (chunk 1)
- TypeScript live-reload setup for the backend (chunk 1 setup)

---

## Chunk notes
*(Filled in as each chunk is built: data model, endpoints, decisions, gotchas.)*
