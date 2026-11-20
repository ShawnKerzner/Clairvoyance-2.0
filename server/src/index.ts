import express from "express";
import { pool } from "./db.js";
import bcrypt from "bcryptjs";
import { createSession } from "./sessions.js";
import cookieParser from "cookie-parser";
import { requireAuth } from "./auth.js";
import Anthropic from "@anthropic-ai/sdk";
import { getOwnedApiKey } from "./apiKey.js";
import { buildReferenceSolution, checkExercise } from "./intakePipeline.js";
import { evaluateParaphrase } from "./understandingPipeline.js";
import { revealParaphrase } from "./understandingPipeline.js";
import { getHint } from "./hintPipeline.js";

const app = express();
app.use(express.json());

app.use(cookieParser(process.env.COOKIE_SECRET));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/db-test", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.status(200).json(result.rows[0].now);
});

app.post("/api/auth/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    res.status(400).json({ Error: "Username or password is empty." });
  } else if (username.length > 15) {
    res.status(400).json({ Error: "Username must be 15 characters or less." });
  } else {
    const result = await pool.query(
      "SELECT username FROM users WHERE username = $1",
      [username],
    );
    if (result.rows.length === 1) {
      res.status(409).json({ Error: "Username already taken." });
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const insertResult = await pool.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
        [username, passwordHash],
      );
      await createSession(insertResult.rows[0].id, res);
      res.status(201).json(insertResult.rows[0]);
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    res.status(400).json({ Error: "Username or password is empty" });
  } else {
    const userResult = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [username],
    );
    if (userResult.rows.length === 0) {
      res.status(401).json({ Error: "Username or password is incorrect." });
    } else {
      const passwordMatch = await bcrypt.compare(
        password,
        userResult.rows[0].password_hash,
      );
      if (!passwordMatch) {
        res.status(401).json({ Error: "Username or password is incorrect." });
      } else {
        await createSession(userResult.rows[0].id, res);
        res.status(200).json({ id: userResult.rows[0].id, username: username });
      }
    }
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const token = req.cookies.session;
  if (token) {
    await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
  }
  res.clearCookie("session");
  res.clearCookie("apiKey");
  res.sendStatus(204);
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.status(200).json({ userId: res.locals.userId });
});

app.post("/api/api-key", requireAuth, async (req, res) => {
  const apiKey = req.body.apiKey;
  if (!apiKey) {
    res.status(400).json({ Error: "Anthropic key required." });
    return;
  }
  const client = new Anthropic({ apiKey: apiKey });
  try {
    await client.models.list();
  } catch {
    res.status(400).json({
      Error:
        "That key didn't work. Check that you copied the whole key from your Anthropic console.",
    });
    return;
  }
  res.cookie("apiKey", apiKey, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  });
  res.cookie("apiKeyOwner", String(res.locals.userId), {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    signed: true,
  });
  res.status(200).json({ connected: true });
});

app.get("/api/api-key", requireAuth, (req, res) => {
  const apiKey = getOwnedApiKey(req, res);
  if (!apiKey) {
    res.status(200).json({ connected: false });
    return;
  }
  res.status(200).json({ connected: true });
});

app.delete("/api/api-key", requireAuth, (req, res) => {
  res.clearCookie("apiKey");
  res.sendStatus(204);
});

app.post("/api/exercises", requireAuth, async (req, res) => {
  const language = req.body.language;
  const exerciseText = req.body.exerciseText;
  const apiKey = getOwnedApiKey(req, res);
  const clarification = req.body.clarification;
  const exercise = {
    language: language,
    exerciseText: exerciseText,
    clarification: clarification,
  };

  if (
    !language ||
    !exerciseText ||
    (language !== "python" && language !== "javascript")
  ) {
    res.status(400).json({
      Error: "Please choose Javascript or Python and paste an exercise",
    });
    return;
  }

  if (!apiKey) {
    res.status(403).json({ Error: "Please connect your API key" });
    return;
  }

  try {
    const result = await checkExercise(apiKey, exercise);

    if (result.status === "INVALID") {
      res.status(400).json({ Error: result.explanation });
      return;
    }

    if (result.status === "UNCLEAR") {
      res.status(200).json({
        needsClarification: true,
        question: result.clarifying_question,
      });
      return;
    }

    const referenceSolution = await buildReferenceSolution(
      apiKey,
      exercise,
      result.signature_given,
    );
    const insertResult = await pool.query(
      `INSERT INTO exercises
         (user_id, language, exercise_text, clarification,
          function_signature, solution_code, approach_notes, assumptions,
          test_cases, self_check_passed, self_check_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, current_stage`,
      [
        res.locals.userId,
        language,
        exerciseText,
        clarification ? JSON.stringify(clarification) : null,
        referenceSolution.solution.function_signature,
        referenceSolution.solution.solution_code,
        referenceSolution.solution.approach_notes,
        referenceSolution.solution.assumptions,
        JSON.stringify(referenceSolution.testCases),
        referenceSolution.selfCheckPassed,
        referenceSolution.selfCheckNotes,
      ],
    );

    const savedExercise = insertResult.rows[0];

    res.status(201).json({
      id: savedExercise.id,
      currentStage: savedExercise.current_stage,
      assumptions: referenceSolution.solution.assumptions,
      exerciseText: exerciseText,
      progress: {},
    });
  } catch {
    res.status(502).json({
      Error: "The AI couldn't process this right now. Please try again.",
    });
  }
});

app.get("/api/exercises/current", requireAuth, async (req, res) => {
  const result = await pool.query(
    `
    SELECT id, current_stage, assumptions, exercise_text, progress
    FROM exercises
    WHERE user_id = $1 AND current_stage != 'complete'
    ORDER BY created_at DESC
    LIMIT 1;`,
    [res.locals.userId],
  );
  if (result.rows.length === 0) {
    res.status(200).json({ exercise: null });
    return;
  }
  res.status(200).json({
    exercise: {
      id: result.rows[0].id,
      currentStage: result.rows[0].current_stage,
      assumptions: result.rows[0].assumptions,
      exerciseText: result.rows[0].exercise_text,
      progress: result.rows[0].progress,
    },
  });
});

app.post("/api/exercises/:id/understanding", requireAuth, async (req, res) => {
  const exerciseId = Number(req.params.id);
  const paraphrase = req.body.paraphrase;
  const apiKey = getOwnedApiKey(req, res);

  if (!paraphrase || !paraphrase.trim()) {
    res
      .status(400)
      .json({ Error: "Please explain the exercise in your own words." });
    return;
  }
  if (!apiKey) {
    res.status(403).json({ Error: "Please connect your API key" });
    return;
  }

  try {
    const exerciseResult = await pool.query(
      `SELECT exercise_text, function_signature, progress
       FROM exercises
       WHERE id = $1 AND user_id = $2 AND current_stage = 'understanding'`,
      [exerciseId, res.locals.userId],
    );
    if (exerciseResult.rows.length === 0) {
      res.status(404).json({ Error: "Exercise not found at this stage." });
      return;
    }

    const row = exerciseResult.rows[0];
    const exercise = {
      exerciseText: row.exercise_text,
      functionSignature: row.function_signature,
    };
    const progress = row.progress;
    const stage = progress.understanding ?? {
      attempts: [],
      gaps: [],
      hintsRequested: 0,
    };
    const attemptNumber = stage.attempts.length + 1;

    const evaluation = await evaluateParaphrase(
      apiKey,
      exercise,
      paraphrase,
      attemptNumber,
      stage.attempts,
    );
    stage.attempts.push(paraphrase);

    if (evaluation.status === "SOLID") {
      stage.finalParaphrase = evaluation.cleaned_paraphrase;
      stage.answerRevealed = false;
      progress.understanding = stage;
      await pool.query(
        `UPDATE exercises SET progress = $1, current_stage = 'logic' WHERE id = $2`,
        [JSON.stringify(progress), exerciseId],
      );
      res
        .status(200)
        .json({ status: "SOLID", paraphrase: evaluation.cleaned_paraphrase });
      return;
    }

    stage.gaps.push(evaluation.gap);

    if (attemptNumber >= 5) {
      const reveal = await revealParaphrase(apiKey, exercise, paraphrase);
      stage.finalParaphrase = reveal.revealed_paraphrase;
      stage.answerRevealed = true;
      progress.understanding = stage;
      await pool.query(
        `UPDATE exercises SET progress = $1, current_stage = 'logic' WHERE id = $2`,
        [JSON.stringify(progress), exerciseId],
      );
      res.status(200).json({
        status: "REVEALED",
        paraphrase: reveal.revealed_paraphrase,
        note: reveal.note,
      });
      return;
    }

    progress.understanding = stage;
    await pool.query(`UPDATE exercises SET progress = $1 WHERE id = $2`, [
      JSON.stringify(progress),
      exerciseId,
    ]);
    res.status(200).json({
      status: "WEAK",
      feedback: evaluation.feedback,
      attemptNumber: attemptNumber + 1,
    });
  } catch {
    res.status(502).json({
      Error: "The AI couldn't process this right now. Please try again.",
    });
  }
});

app.post("/api/exercises/:id/hint", requireAuth, async (req, res) => {
  const exerciseId = Number(req.params.id);
  const apiKey = getOwnedApiKey(req, res);
  if (!apiKey) {
    res.status(403).json({ Error: "Please connect your API key" });
    return;
  }

  try {
    const exerciseResult = await pool.query(
      `SELECT exercise_text, language, solution_code, progress
       FROM exercises
       WHERE id = $1 AND user_id = $2 AND current_stage = 'understanding'`,
      [exerciseId, res.locals.userId],
    );
    if (exerciseResult.rows.length === 0) {
      res.status(404).json({ Error: "Exercise not found at this stage." });
      return;
    }

    const row = exerciseResult.rows[0];
    const progress = row.progress;
    const stage = progress.understanding ?? {
      attempts: [],
      gaps: [],
      hintsRequested: 0,
    };
    stage.hintsRequested += 1;

    const result = await getHint(apiKey, {
      stage: "understanding",
      hintNumber: String(stage.hintsRequested),
      exerciseText: row.exercise_text,
      language: row.language,
      solutionCode: row.solution_code,
      stageContext:
        "The student is explaining in their own words what the exercise asks.",
      attemptsSoFar: stage.attempts.join("\n"),
    });

    progress.understanding = stage;
    await pool.query(`UPDATE exercises SET progress = $1 WHERE id = $2`, [
      JSON.stringify(progress),
      exerciseId,
    ]);

    res.status(200).json({ hint: result });
  } catch (error) {
    console.error(error);
    res.status(502).json({
      Error: "The AI couldn't process this right now. Please try again.",
    });
  }
});

app.listen(3000, () => {
  console.log("server is listening on port 3000...");
});
