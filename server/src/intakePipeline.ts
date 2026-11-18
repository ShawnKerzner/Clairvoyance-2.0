import { stringify } from "node:querystring";
import { askClaude } from "./askClaude.js";
import { fillPrompt } from "./prompts/fillPrompt.js";
import {
  VALIDATE_EXERCISE,
  SILENT_SOLVE,
  GENERATE_TEST_CASES,
  SELF_CHECK,
} from "./prompts/intake.js";

type ExerciseInput = {
  language: string;
  exerciseText: string;
  clarification?: {
    question: string;
    answer: string;
  };
};

type SolveResult = {
  function_signature: string;
  solution_code: string;
  approach_notes: string;
  assumptions: string;
};

type TestCase = {
  call: string;
  expected_output: string;
  is_edge_case: boolean;
  required_by_exercise: boolean;
  edge_case_note: string;
};

type TestCaseResults = {
  test_cases: TestCase[];
};

const formatClarification = (input: ExerciseInput) => {
  if (!input.clarification) {
    return "";
  } else {
    return `<clarification>
        question: ${input.clarification.question},
        student's answer: ${input.clarification.answer}
        </clarification>
        `;
  }
};

export const checkExercise = async (
  apiKey: string,
  exercise: ExerciseInput,
) => {
  const prompt = fillPrompt(VALIDATE_EXERCISE, {
    language: exercise.language,
    exerciseText: exercise.exerciseText,
    clarificationContext: formatClarification(exercise),
  });
  const result = await askClaude(apiKey, prompt);
  return result;
};

export const solveExercise = async (
  apiKey: string,
  exercise: ExerciseInput,
  signatureGiven: boolean,
  fixContext: string,
) => {
  const signatureInstruction = signatureGiven
    ? `Use exactly the function name and parameters given in the exercise.`
    : `Choose a clear, conventional function name and parameters.`;
  const prompt = fillPrompt(SILENT_SOLVE, {
    language: exercise.language,
    exerciseText: exercise.exerciseText,
    clarificationContext: formatClarification(exercise),
    fixContext: fixContext,
    signatureInstruction: signatureInstruction,
  });
  const result = await askClaude(apiKey, prompt);
  return result;
};

export const writeTestCases = async (
  apiKey: string,
  exercise: ExerciseInput,
  solution: SolveResult,
) => {
  const prompt = fillPrompt(GENERATE_TEST_CASES, {
    language: exercise.language,
    exerciseText: exercise.exerciseText,
    functionSignature: solution.function_signature,
    solutionCode: solution.solution_code,
  });
  const result = await askClaude(apiKey, prompt);
  return result;
};

export const checkSolution = async (
  apiKey: string,
  exercise: ExerciseInput,
  solution: SolveResult,
  tests: TestCaseResults,
) => {
  const prompt = fillPrompt(SELF_CHECK, {
    language: exercise.language,
    exerciseText: exercise.exerciseText,
    functionSignature: solution.function_signature,
    solutionCode: solution.solution_code,
    testCases: JSON.stringify(tests.test_cases),
  });
  const result = await askClaude(apiKey, prompt);
  return result;
};
