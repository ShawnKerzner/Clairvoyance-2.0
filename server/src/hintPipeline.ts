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

export const hintContextForStage = (
  stage: string,
  progress: Record<string, any>,
) => {
  if (stage === "understanding") {
    progress.understanding ??= { attempts: [], gaps: [], hintsRequested: 0 };
    const record = progress.understanding;
    return {
      record,
      promptStage: "understanding",
      stageContext:
        "The student is explaining in their own words what the exercise asks.",
      attempts: record.attempts,
    };
  }

  if (stage === "logic") {
    progress.logic ??= {
      steps: [],
      current: { attempts: [], gaps: [], hintsRequested: 0 },
      pendingEdgeCase: null,
      edgeCases: [],
      revealedSteps: 0,
    };
    const logic = progress.logic;
    const plan =
      logic.steps
        .map((step: string, i: number) => `${i + 1}. ${step}`)
        .join("\n") || "(no steps yet)";

    if (logic.pendingEdgeCase) {
      logic.pendingEdgeCase.hintsRequested ??= 0;
      return {
        record: logic.pendingEdgeCase,
        promptStage: "edge_case",
        stageContext: `Their plan so far:\n${plan}\n\nThey were asked: ${logic.pendingEdgeCase.question}`,
        attempts: logic.pendingEdgeCase.attempts,
      };
    }

    return {
      record: logic.current,
      promptStage: "logic_step",
      stageContext: `The student is writing the NEXT step of their plan. These steps are ALREADY in their plan and done, so never hint at any of them again:\n${plan}\n\nYour hint must be about what should come right AFTER the last step listed.`,
      attempts: logic.current.attempts,
    };
  }

  return null;
};
