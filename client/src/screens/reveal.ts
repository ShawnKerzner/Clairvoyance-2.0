import { app, findElement, showError, showScreen } from "../app.ts";
import { logOut } from "../navigation.ts";
import { postJson } from "../api.ts";
import { handleAuthErrors, stageRow, setupStudyScreen } from "../screenHelpers.ts";
import { createNova } from "../nova.ts";
import { celebrate } from "../celebrate.ts";
import { setSkyMode } from "../sky.ts";
import { renderExerciseIntake } from "./intake.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
};

export const renderReveal = (exercise: Exercise) => {
  app.innerHTML = `
    ${stageRow("review")}
    <div class="stage-page">
      <main class="card review" id="reveal-card">
        <p id="reveal-error" class="auth-error"></p>
        <div class="loading-state" id="reveal-loading">
          <canvas class="loading-nova" id="reveal-nova" aria-hidden="true"></canvas>
          <p class="loading-line">Preparing your review…</p>
          <p class="loading-sub">Comparing your code with the reference solution.</p>
        </div>

        <div id="reveal-content" hidden>
          <h1>You solved it</h1>
          <section id="reveal-exercise" class="cascade" style="--order: 1">
            <p class="lead" id="reveal-exercise-text"></p>
          </section>

          <section id="reveal-code" class="codes cascade" style="--order: 2">
            <div class="col">
              <span class="code-label">Your code</span>
              <pre id="reveal-student-code" class="code-so-far"></pre>
            </div>
            <div class="col">
              <span class="code-label">Reference solution</span>
              <pre id="reveal-solution-code" class="code-so-far"></pre>
            </div>
          </section>

          <section id="reveal-feedback" class="sections">
            <div class="section cascade" style="--order: 3">
              <h2>How they compare</h2>
              <p id="reveal-comparison"></p>
            </div>
            <div class="section cascade" style="--order: 4">
              <h2>The idea behind the reference</h2>
              <p id="reveal-explanation"></p>
            </div>
            <div class="section journey cascade" style="--order: 5">
              <h2>Your journey</h2>
              <p id="reveal-recap"></p>
            </div>
          </section>
          <button type="button" id="reveal-finish-btn" class="finish cascade" style="--order: 6">Finish and start a new exercise</button>
        </div>

        <div class="key-footer">
          <span></span>
          <a href="#" id="logout-link">Log out</a>
        </div>
      </main>
    </div>
  `;
  findElement("#reveal-exercise-text").textContent = exercise.exerciseText;
  logOut("#reveal-error");
  const nova = createNova(findElement<HTMLCanvasElement>("#reveal-nova"), 4);
  setupStudyScreen();
  loadReveal(exercise, nova.burst);
  setupFinishButton(exercise);
};

const MIN_SPELL_MS = 2500;

const loadReveal = async (exercise: Exercise, burstSpell: () => void) => {
  const spellStarted = Date.now();
  try {
    const response = await postJson(`/api/exercises/${exercise.id}/reveal`, {});
    if (handleAuthErrors(response)) return;
    const data = await response.json();
    if (!response.ok) {
      showError("#reveal-error", data.Error);
      return;
    }

    findElement("#reveal-student-code").textContent = data.studentCode;
    findElement("#reveal-solution-code").textContent = data.solutionCode;
    findElement("#reveal-comparison").textContent = data.comparison;
    findElement("#reveal-explanation").textContent = data.approach_explanation;
    findElement("#reveal-recap").textContent = data.growth_recap;

    // Let the spell charge for a moment even if the server answers instantly
    const waitMore = MIN_SPELL_MS - (Date.now() - spellStarted);
    if (waitMore > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMore));
    if (!document.querySelector("#reveal-loading")) return;

    // 1. The spell bursts where it sits
    const spell = findElement("#reveal-nova").getBoundingClientRect();
    burstSpell();
    celebrate(spell.left + spell.width / 2, spell.top + spell.height / 2);

    // 2. The stages light up one after another
    document.querySelectorAll("#stage-row .stage").forEach((stage, i) => {
      window.setTimeout(() => stage.classList.add("ignite"), 250 + i * 220);
    });

    // 3. The review appears: the heading catches the light, then the blocks cascade in
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    if (!document.querySelector("#reveal-loading")) return;
    findElement<HTMLElement>("#reveal-loading").hidden = true;
    findElement<HTMLElement>("#reveal-content").hidden = false;
    findElement("#reveal-content h1").classList.add("shine");

    // 4. Afterwards the sky stays lively: two constellations every 3 seconds
    window.setTimeout(() => setSkyMode("celebrate"), 3500);
  } catch {
    showError("#reveal-error", "Can't reach the server, please try again.");
  }
};

const setupFinishButton = (exercise: Exercise) => {
  findElement("#reveal-finish-btn").addEventListener("click", async () => {
    try {
      const response = await postJson(
        `/api/exercises/${exercise.id}/finish`,
        {},
      );
      if (handleAuthErrors(response)) return;
      if (!response.ok) {
        const data = await response.json();
        showError("#reveal-error", data.Error);
        return;
      }
      showScreen(renderExerciseIntake);
    } catch {
      showError("#reveal-error", "Can't reach the server, please try again.");
    }
  });
};
