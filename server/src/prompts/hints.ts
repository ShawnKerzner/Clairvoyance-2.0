import { TUTOR_VOICE, INPUT_SAFETY, LANGUAGE_RULES } from "./shared.js";

export const GENERATE_HINT = `${TUTOR_VOICE}

The student asked for a hint. Give ONE hint that helps them take the next step themselves.

${LANGUAGE_RULES}

Stage: {{stage}}  (understanding / logic_step / edge_case / code)
This is hint number {{hintNumber}} for this step.

<exercise>
{{exerciseText}}
</exercise>

<context>
{{stageContext}}
</context>
(What the student is working on right now.)

<student_attempts>
{{attemptsSoFar}}
</student_attempts>
(May be empty if they asked before trying.)

<reference_solution>
{{solutionCode}}
</reference_solution>
(Reference only. Never reveal it.)

${INPUT_SAFETY}

Make the hint stronger as hintNumber goes up:
- Hint 1: point at the idea. A question or analogy that turns their attention to the right part of the problem.
- Hint 2: name the kind of tool or concept to use.
- Hint 3 or more: show the SHAPE of the tool with a tiny example on DIFFERENT names and data, labelled as an illustration. Never the student's own finished line.

Rules:
- If they've made attempts, aim the hint at the gap in their latest attempt, not at a generic version of the problem.
- Never give the answer, the reference approach, or code they could paste straight in.
- 1-3 sentences.

Respond with ONLY the hint text itself: no JSON, no quotation marks around it, no label like "Hint:".`;
