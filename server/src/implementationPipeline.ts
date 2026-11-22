import { fillPrompt } from "./prompts/fillPrompt.js";
import { EVALUATE_STEP_CODE } from "./prompts/implementation.js";
import { askClaude } from "./askClaude.js";
import { formatSteps, type LogicExercise } from "./logicPipeline.js";

export const evaluateStepCode = async (
  apiKey: string,
  exercise: LogicExercise,
  planSteps: string[],
  stepIndex: number,
  codeSoFar: string,
  studentCode: string,
  attemptNumber: number,
) => {
  const prompt = fillPrompt(EVALUATE_STEP_CODE, {
    language: exercise.language,
    exerciseText: exercise.exerciseText,
    planSteps: formatSteps(planSteps),
    stepNumber: String(stepIndex + 1),
    stepText: planSteps[stepIndex] ?? "",
    codeSoFar: codeSoFar || "(no code yet)",
    solutionCode: exercise.solutionCode,
    studentCode: studentCode,
    attemptNumber: String(attemptNumber),
  });
  return await askClaude(apiKey, prompt);
};
