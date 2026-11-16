import { INPUT_SAFETY, LANGUAGE_RULES } from "./shared.js";

export const VALIDATE_EXERCISE = `You check whether text pasted into Clairvoyance is a real coding exercise that a beginner can solve as a single function in {{language}}.

<exercise>
{{exerciseText}}
</exercise>
{{clarificationContext}}

${INPUT_SAFETY}

Decide one status:

INVALID: the text is not a coding exercise at all (gibberish, random words, a question unrelated to programming, a request to just write an essay), OR it is far too large for one function (a whole app, a multi-file project). Write a short, friendly explanation addressed to the student ("you") saying why, and what kind of exercise works here. Do not ask clarifying questions.

UNCLEAR: it is a real exercise, but it could reasonably mean two fundamentally different things that lead to incompatible solutions. Ask ONE specific clarifying question. Do NOT ask about edge cases that have an obvious standard convention (an empty list summing to 0, "numbers" meaning numeric input, and so on). Those are CLEAR, handled with standard defaults.

CLEAR: a real exercise solvable with reasonable defaults.

Notes:
- If the exercise names a different programming language than {{language}}, it is NOT invalid for that reason. Treat the underlying task as the exercise; the language difference becomes an assumption downstream.
- If the clarification context already contains an answer from the student, use it. Never ask a second clarifying question; if it's still ambiguous, mark it CLEAR and let the solver state its assumptions.

Also report:
- signature_given: true if the exercise text names the function or spells out its exact parameters; false if the solver must choose them.
- asks_for_user_input: true if the exercise describes interactively asking the user for input ("prompt the user", "read from the keyboard"); false otherwise.

Respond with JSON only:
{
  "status": "CLEAR" | "UNCLEAR" | "INVALID",
  "explanation": "for INVALID only, else empty string",
  "clarifying_question": "for UNCLEAR only, else empty string",
  "signature_given": true | false,
  "asks_for_user_input": true | false
}`;

export const SILENT_SOLVE = `You are an expert {{language}} developer writing the hidden reference solution for a beginner coding exercise. The student never sees this until the very end, when it is shown next to their own code as a learning comparison. So it must be correct, clear and written the way a good teacher would write it for a beginner.

<exercise>
{{exerciseText}}
</exercise>
{{clarificationContext}}
{{fixContext}}

${LANGUAGE_RULES}

Requirements:
1. Signature. {{signatureInstruction}}
   - If the exercise names the function or its parameters, use exactly those.
   - Otherwise choose a clear, conventional name and parameters.
   - If the exercise asks for interactive user input, do NOT read input. Write a function that receives those values as parameters instead, and state this in assumptions.
2. Write a complete, correct solution in {{language}} using that signature. Prefer the clear, beginner-readable approach over the clever one. Use only built-in features of the language, no libraries.
3. Comments: one short comment per logical step, explaining WHY, not restating the code.
4. Edge cases: handle the edge cases a careful developer would handle for this problem. When the input is invalid or empty and the exercise doesn't say what to return, throw/raise a clear, descriptive error (JavaScript: throw new Error("..."); Python: raise ValueError("...")) rather than silently returning a placeholder like null/None. If the exercise does specify a return value for that case, follow the exercise.
5. Formatting: real newlines between lines, standard indentation (2 spaces for JavaScript, 4 for Python), one statement per line, exactly as it would look in a source file. Never squash code onto one line.
6. Approach notes for the final reveal: write 2-4 short sentences, addressed to the student ("you"), explaining the approach this solution takes and why it's a good fit for this problem. Mention one alternative valid approach if there is a common one. These notes stay hidden until the reveal.
7. Assumptions: list any assumption you made (a default you chose, input converted to parameters, a different language requested in the exercise, and so on). Empty string if none.

Respond with JSON only:
{
  "function_signature": "the single signature line",
  "solution_code": "the full solution",
  "approach_notes": "2-4 sentences for the reveal",
  "assumptions": "text or empty string"
}`;

export const GENERATE_TEST_CASES = `You are writing test cases for a {{language}} function. They are used behind the scenes to check the reference solution and to know which edge cases matter for this exercise.

<exercise>
{{exerciseText}}
</exercise>

<signature>
{{functionSignature}}
</signature>

<solution>
{{solutionCode}}
</solution>

${LANGUAGE_RULES}

Write 4 to 6 test cases:
- At least 2 normal cases that show the core behaviour.
- At least 2 edge cases relevant to THIS problem (empty input, a single item, boundary values, invalid input, duplicates, and so on). Only include edge cases that genuinely matter for this problem.

For each test case:
- call: the exact function call written in {{language}}, e.g. sumList([1, 2, 3]) or sum_list([1, 2, 3])
- expected_output: always a string. Write the value the way {{language}} would display it (e.g. "6", "[1, 2, 3]", "true"/"True"). For a case that throws/raises, write "throws: <the error message>".
- is_edge_case: true or false
- required_by_exercise: true only if the exercise text itself explicitly says how this case must be handled (e.g. "return 0 for an empty list"). Otherwise false.
- edge_case_note: for edge cases only, one plain-English sentence describing the situation, e.g. "The list is empty." Empty string for normal cases.

Respond with JSON only:
{ "test_cases": [ { "call": "...", "expected_output": "...", "is_edge_case": true, "required_by_exercise": false, "edge_case_note": "..." } ] }`;

export const SELF_CHECK = `You are independently reviewing someone else's {{language}} solution. You have never seen it before and you did not write it. Be skeptical.

<exercise>
{{exerciseText}}
</exercise>

<signature>
{{functionSignature}}
</signature>

<solution>
{{solutionCode}}
</solution>

<test_cases>
{{testCases}}
</test_cases>

For each test case, trace the solution by hand, line by line, with that exact input, and work out what it actually returns or throws. Write it the same way as expected_output (a string; "throws: <message>" for errors). Compare it with expected_output.

Also check: does the solution actually do what the exercise asks, including anything the test cases don't cover?

Respond with JSON only:
{
  "results": [ { "call": "...", "actual_output": "...", "matches": true } ],
  "overall_status": "PASS" | "FAIL",
  "reasoning": "explain every mismatch or problem, or empty string if PASS"
}`;
