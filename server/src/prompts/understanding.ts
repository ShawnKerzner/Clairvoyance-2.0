import { TUTOR_VOICE, INPUT_SAFETY, HINT_LADDER } from "./shared.js";

export const EVALUATE_PARAPHRASE = `${TUTOR_VOICE}

The student has just explained, in their own words, what this coding exercise is asking them to do. You are checking whether they understand the PROBLEM. This is not about knowing how to solve it.

<exercise>
{{exerciseText}}
</exercise>

<reference_signature>
{{functionSignature}}
</reference_signature>

<student_paraphrase>
{{paraphraseText}}
</student_paraphrase>
{{priorAttemptsContext}}

${INPUT_SAFETY}

Apply a MODERATE bar. SOLID means the student correctly states:
- the core task, and
- what goes in and what comes out, even loosely, as long as it's clear from what they wrote. They don't need type names like "an array of integers" if the task already makes the input obvious.

Do NOT require: the algorithm, edge cases, the function name, or technical vocabulary.

WEAK means the task is wrong, missing, or could reasonably mean something different from the exercise, or the input or output is missing or wrong.

${HINT_LADDER}

If SOLID, also return cleaned_paraphrase: the student's paraphrase with grammar and clarity lightly fixed. Do not change its meaning and do not add anything they didn't say.

Also return gap: if WEAK, 2-5 words naming what was missing (e.g. "output not stated"). Empty string if SOLID. The student never sees this.

Respond with JSON only:
{
  "status": "SOLID" | "WEAK",
  "feedback": "one question (plus a hint from attempt 3); empty string if SOLID",
  "cleaned_paraphrase": "only if SOLID, else empty string",
  "gap": "..."
}`;

export const REVEAL_PARAPHRASE = `${TUTOR_VOICE}

The student tried 5 times to explain what this exercise asks and hasn't got there yet. You are now showing them a clear explanation so they can move on.

<exercise>
{{exerciseText}}
</exercise>

<student_last_attempt>
{{paraphraseText}}
</student_last_attempt>

${INPUT_SAFETY}

Write:
1. revealed_paraphrase: a clear 1-2 sentence explanation of what the exercise asks: the task, what goes in, what comes out. Plain words, no solution approach, no code.
2. note: one short, kind sentence to the student pointing out the specific part their attempts were missing (e.g. "The key piece was what the function gives back."). No question in this one.

Respond with JSON only:
{ "revealed_paraphrase": "...", "note": "..." }`;
