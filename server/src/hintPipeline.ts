import { fillPrompt } from "./prompts/fillPrompt.js";
import { GENERATE_HINT } from "./prompts/hints.js";
import { askClaudeText } from "./askClaude.js";

export const getHint = async (
  apiKey: string,
  values: Record<string, string>,
) => {
  const prompt = fillPrompt(GENERATE_HINT, values);
  return await askClaudeText(apiKey, prompt);
};
