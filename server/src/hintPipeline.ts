import { fillPrompt } from "./prompts/fillPrompt.js";
import { GENERATE_HINT } from "./prompts/hints.js";
import { askClaude } from "./askClaude.js";

export const getHint = async (
  apiKey: string,
  values: Record<string, string>,
) => {
  const prompt = fillPrompt(GENERATE_HINT, values);
  return await askClaude(apiKey, prompt);
};
