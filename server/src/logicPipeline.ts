import { fillPrompt } from "./prompts/fillPrompt.js";
import { EVALUATE_LOGIC_STEP } from "./prompts/logic.js";
import { askClaude } from "./askClaude.js";

export type LogicExercise = {
  exerciseText: string;
  language: string;
  functionSignature: string;
  solutionCode: string;
  finalParaphrase: string;
  testCases: {
    test_cases: {
      is_edge_case: boolean;
      required_by_exercise: boolean;
      edge_case_note: string;
    }[];
  };
};

const formatSteps = (steps: string[]) => {
  if (steps.length === 0) {
    return "(no steps yet)";
  }
  return steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
};

const formatEdgeCases = (exercise: LogicExercise, requiredOnly: boolean) => {
  const lines = exercise.testCases.test_cases
    .filter(
      (test) =>
        test.is_edge_case && (!requiredOnly || test.required_by_exercise),
    )
    .map(
      (test) =>
        `- ${test.edge_case_note} (required by exercise: ${test.required_by_exercise})`,
    );
  if (lines.length === 0) {
    return "(none)";
  }
  return lines.join("\n");
};

export const evaluateLogicStep = async (
  apiKey: string,
  exercise: LogicExercise,
  acceptedSteps: string[],
  stepText: string,
  attemptNumber: number,
) => {
  const prompt = fillPrompt(EVALUATE_LOGIC_STEP, {
    language: exercise.language,
    exerciseText: exercise.exerciseText,
    finalParaphrase: exercise.finalParaphrase,
    functionSignature: exercise.functionSignature,
    solutionCode: exercise.solutionCode,
    acceptedSteps: formatSteps(acceptedSteps),
    edgeCases: formatEdgeCases(exercise, false),
    stepText: stepText,
    attemptNumber: String(attemptNumber),
  });
  return await askClaude(apiKey, prompt);
};
