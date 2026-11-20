import { pool } from "./db.js";
import type { LogicExercise } from "./logicPipeline.js";

export const loadExerciseAtStage = async (
  exerciseId: number,
  userId: number,
  stage: string,
) => {
  const result = await pool.query(
    `SELECT exercise_text, language, function_signature, solution_code, test_cases, progress
     FROM exercises
     WHERE id = $1 AND user_id = $2 AND current_stage = $3`,
    [exerciseId, userId, stage],
  );
  if (result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  const exercise: LogicExercise = {
    exerciseText: row.exercise_text,
    language: row.language,
    functionSignature: row.function_signature,
    solutionCode: row.solution_code,
    finalParaphrase: row.progress.understanding?.finalParaphrase ?? "",
    testCases: row.test_cases,
  };
  return { exercise, progress: row.progress };
};

export const saveProgress = async (
  exerciseId: number,
  progress: object,
  nextStage?: string,
) => {
  if (nextStage) {
    await pool.query(
      `UPDATE exercises SET progress = $1, current_stage = $2 WHERE id = $3`,
      [JSON.stringify(progress), nextStage, exerciseId],
    );
  } else {
    await pool.query(`UPDATE exercises SET progress = $1 WHERE id = $2`, [
      JSON.stringify(progress),
      exerciseId,
    ]);
  }
};
