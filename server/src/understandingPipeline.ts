import { fillPrompt } from "./prompts/fillPrompt.js";
import {
  EVALUATE_PARAPHRASE,
  REVEAL_PARAPHRASE,
} from "./prompts/understanding.js";
import { askClaude } from "./askClaude.js";

type SavedExercise = {
  exerciseText: string;
  functionSignature: string;
};

export const evaluateParaphrase = async (
  apiKey: string,
  exercise: SavedExercise,
  paraphrase: string,
  attemptNumber: number,
  priorAttempts: string[],
) => {
  const prompt = fillPrompt(EVALUATE_PARAPHRASE, {
    exerciseText: exercise.exerciseText,
    functionSignature: exercise.functionSignature,
    paraphraseText: paraphrase,
    attemptNumber: String(attemptNumber),
    priorAttemptsContext: formatPriorAttempts(priorAttempts),
  });
  return await askClaude(apiKey, prompt);
};

const formatPriorAttempts = (priorAttempts: string[]) => {
  if (priorAttempts.length === 0) {
    return "";
  }
  const lines = priorAttempts
    .map((attempt, index) => `Attempt ${index + 1}: ${attempt}`)
    .join("\n");
  return `<prior_attempts>
  ${lines}
  </prior_attempts>
  `;
};

export const revealParaphrase = async (
  apiKey: string,
  exercise: SavedExercise,
  paraphrase: string,
) => {
  const prompt = fillPrompt(REVEAL_PARAPHRASE, {
    exerciseText: exercise.exerciseText,
    paraphraseText: paraphrase,
  });
  return await askClaude(apiKey, prompt);
};
