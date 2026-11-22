type StepRecord = {
  attempts: string[];
  gaps: string[];
  hintsRequested: number;
};

const totals = (records: StepRecord[]) => ({
  attempts: records.reduce((sum, r) => sum + r.attempts.length, 0),
  hints: records.reduce((sum, r) => sum + (r.hintsRequested ?? 0), 0),
  gaps: records.flatMap((r) => r.gaps).filter((gap) => gap),
});

export const summarizeJourney = (progress: Record<string, any>) => {
  const lines: string[] = [];

  const u = progress.understanding;
  if (u) {
    lines.push(
      `Understanding: ${u.attempts.length} attempt(s), ${u.hintsRequested ?? 0} hint(s), ` +
        `${u.answerRevealed ? "answer was revealed" : "got there themselves"}. Gaps: ${u.gaps.join(", ") || "none"}.`,
    );
  }

  const logic = progress.logic;
  if (logic) {
    const t = totals(logic.history ?? []);
    const skipped = (logic.edgeCases ?? [])
      .filter((e: any) => e.outcome !== "answered")
      .map((e: any) => e.note);
    lines.push(
      `Planning: ${logic.steps.length} steps, ${t.attempts} attempt(s), ${t.hints} hint(s), ` +
        `${logic.revealedSteps} step(s) revealed. Gaps: ${t.gaps.join(", ") || "none"}. ` +
        `Edge cases skipped or unresolved: ${skipped.join("; ") || "none"}.`,
    );
  }

  const impl = progress.implementation;
  if (impl) {
    const t = totals(impl.history ?? []);
    lines.push(
      `Coding: ${t.attempts} attempt(s), ${t.hints} hint(s), ${impl.revealedSteps} step(s) revealed. ` +
        `Gaps: ${t.gaps.join(", ") || "none"}.`,
    );
  }

  return lines.join("\n");
};
