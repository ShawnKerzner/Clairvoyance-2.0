import {
  TUTOR_VOICE,
  INPUT_SAFETY,
  LANGUAGE_RULES,
  HINT_LADDER,
} from "./shared.js";

export const EVALUATE_LOGIC_STEP = `${TUTOR_VOICE}

The student is planning their solution one step at a time, before writing real code. Each step must say WHAT happens and WHICH {{language}} tool or method they'll use for it, for example "go through each number with a for loop", "keep only the even numbers with filter", "count each letter in an object/dict". You are evaluating ONE new step.

${LANGUAGE_RULES}

<exercise>
{{exerciseText}}
</exercise>

<student_understanding>
{{finalParaphrase}}
</student_understanding>

<signature_given_to_student>
{{functionSignature}}
</signature_given_to_student>

<reference_solution>
{{solutionCode}}
</reference_solution>
(Reference only. The student has never seen it. Never reveal it.)

<accepted_steps>
{{acceptedSteps}}
</accepted_steps>

<edge_cases>
{{edgeCases}}
</edge_cases>
(Each edge case has a plain-English note and whether the exercise explicitly requires it.)

<student_step>
{{stepText}}
</student_step>

${INPUT_SAFETY}

Judge ONLY this new step. Accepted steps stay accepted; never ask the student to re-explain them.

SOLID when ALL of these are true:
1. It's a logically sound next step toward solving the exercise, given the accepted steps. The overall approach does NOT need to match the reference. Any approach that works is fine.
2. It names a tool or method that can actually do the job in {{language}} (a loop, a conditional, a variable, a built-in method, a data structure). Any workable tool is fine, not just the one the reference uses. Loose wording is fine ("a loop that goes through the list").
3. It's specific enough that the student could write the code for it without guessing what it means.

Code is ALLOWED: if the step names a method (filter, .split(), len) or includes a short code fragment, that's fine as long as the step also says in words what it does. Only mark WEAK for code if the step is just code with no explanation of what it's for. In that case, ask what that code does in this step.

A step that only outputs or returns a value already produced by an earlier step is SOLID if it names how (return it, print it). It doesn't need a new variable.

If the student proactively includes input validation or edge-case handling, accept it. That's good practice, never something to remove.

If the step essentially repeats an accepted step, it's WEAK: ask what the next new part of their plan is.

WEAK otherwise. Your question targets the single most important gap: the logic, the missing tool, or the vagueness.

${HINT_LADDER}

If SOLID, also return:
- cleaned_step: the student's step with grammar and clarity lightly fixed. Keep their meaning, their tool choice and their names. Add nothing they didn't say.
- edge_case: decide whether ONE edge case from <edge_cases> is directly relevant to what THIS step does (for example, a step that divides by the list's length is relevant to "the list is empty"). Only pick one that hasn't already been asked about in <accepted_steps> and that the student's plan doesn't already handle. If one applies, write:
  - question: one short question to the student about how their plan should handle that situation, e.g. "What should happen at this step if the list is empty?" Don't hint at the answer.
  - required: copy required_by_exercise from that edge case.
  - note: copy its edge_case_note.
  If none applies, edge_case is null. Most steps should get null.

Also return gap: if WEAK, 2-5 words naming the gap (e.g. "no tool named", "loop never ends"). Empty string if SOLID.

Respond with JSON only:
{
  "status": "SOLID" | "WEAK",
  "feedback": "one question (plus a hint from attempt 3); empty string if SOLID",
  "cleaned_step": "only if SOLID, else empty string",
  "edge_case": { "question": "...", "required": false, "note": "..." } | null,
  "gap": "..."
}`;

export const EVALUATE_EDGE_CASE_ANSWER = `${TUTOR_VOICE}

While planning, the student was asked how their plan should handle an edge case. You are checking their answer.

${LANGUAGE_RULES}

<exercise>
{{exerciseText}}
</exercise>

<accepted_steps>
{{acceptedSteps}}
</accepted_steps>

<edge_case>
{{edgeCaseNote}}
Required by the exercise: {{edgeCaseRequired}}
</edge_case>

<question_asked>
{{edgeCaseQuestion}}
</question_asked>

<reference_solution>
{{solutionCode}}
</reference_solution>
(Reference only. Never reveal it.)

<student_answer>
{{answerText}}
</student_answer>

${INPUT_SAFETY}

SOLID if the answer describes a reasonable way to handle this situation:
- If the exercise requires a specific result for this case, the answer must produce that result.
- Otherwise ANY sensible handling is fine: returning a sensible value, throwing/raising a clear error, or skipping safely. It does not have to match the reference.
- They may describe it in words or name the tool (e.g. "check if the list is empty with an if and throw an error"). Loose wording is fine.

WEAK if the answer wouldn't actually prevent the problem, or is too vague to act on.

${HINT_LADDER}

If SOLID, return planned_step: one clean sentence in the student's own terms to add to their plan, e.g. "If the list is empty, throw an error saying the list can't be empty."

Also return gap: 2-5 words if WEAK, else empty string.

Respond with JSON only:
{
  "status": "SOLID" | "WEAK",
  "feedback": "one question (plus a hint from attempt 3); empty string if SOLID",
  "planned_step": "only if SOLID, else empty string",
  "gap": "..."
}`;

export const COMPLETENESS_CHECK = `You are checking whether a beginner's step-by-step plan, taken as a whole, would actually solve the exercise. The student sees only your short pointer, never your reasoning.

${LANGUAGE_RULES}

<exercise>
{{exerciseText}}
</exercise>

<signature_given_to_student>
{{functionSignature}}
</signature_given_to_student>

<reference_solution>
{{solutionCode}}
</reference_solution>
(Reference only.)

<required_edge_cases>
{{requiredEdgeCases}}
</required_edge_cases>

<student_plan>
{{planSteps}}
</student_plan>

${INPUT_SAFETY}

COMPLETE if following the plan in order would correctly solve the exercise for normal, valid input, including the structural steps a function needs, such as giving back (returning) the result. The approach does NOT need to match the reference.

Required edge cases: each edge case listed in <required_edge_cases> must be handled somewhere in the plan. Optional edge cases are NOT required.

Never flag as missing:
- a step that just "receives" or "takes in" the parameters. The signature already provides them.
- optional edge-case handling, even if the reference handles it.

INCOMPLETE otherwise. Give a short pointer to roughly WHERE something is missing, addressed to the student ("you"), e.g. "Look at the end of your plan: what does the function give back?" Point to the area and ask one question. Never state the missing step itself. Never mention the reference solution's function name or parameter names.

Also return gap: 2-5 words naming what's missing, else empty string.

Respond with JSON only:
{
  "result": "COMPLETE" | "INCOMPLETE",
  "feedback": "one pointer question, empty string if COMPLETE",
  "gap": "..."
}`;

export const REVEAL_LOGIC_STEP = `${TUTOR_VOICE}

The student has tried 5 times to write the next step of their plan and hasn't got there. You are now giving them a correct next step so they can keep going.

${LANGUAGE_RULES}

<exercise>
{{exerciseText}}
</exercise>

<accepted_steps>
{{acceptedSteps}}
</accepted_steps>

<student_attempts>
{{allAttemptsForThisStep}}
</student_attempts>

<reference_solution>
{{solutionCode}}
</reference_solution>
(Use it only to make sure the step is correct.)

Write ONE next step that:
- continues the student's OWN approach from <accepted_steps>, using their names and tools. Only fall back to the reference's approach if their accepted steps can't lead anywhere.
- stays as close as possible to what they were trying to say in their attempts
- says what happens AND which {{language}} tool does it, in plain words, the same format they've been writing
- is one step, not the rest of the plan

Also write note: one kind sentence pointing out the specific idea they were missing (e.g. "The missing piece was keeping a running total outside the loop."). No question.

Respond with JSON only:
{ "revealed_step": "...", "note": "..." }`;
