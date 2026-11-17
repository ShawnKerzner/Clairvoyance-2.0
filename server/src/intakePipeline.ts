import { askClaude } from "./askClaude.js";
import { fillPrompt } from "./prompts/fillPrompt.js";
import { VALIDATE_EXERCISE, SILENT_SOLVE } from "./prompts/intake.js";

type ExerciseInput = {
  language: string;
  exerciseText: string;
  clarification?: {
    question: string;
    answer: string;
  };
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
