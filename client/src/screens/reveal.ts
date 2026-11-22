import { app, findElement, showError, showScreen } from "../app.ts";
import { logOut } from "../navigation.ts";
import { postJson } from "../api.ts";
import { handleAuthErrors } from "../screenHelpers.ts";
import { renderExerciseIntake } from "./intake.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
};

export const renderReveal = (exercise: Exercise) => {
  app.innerHTML = `
    <h1>Final Reveal</h1>
    <p id="reveal-error"></p>
    <p id="reveal-loading">Preparing your review… This can take a few seconds.</p>

    <section id="reveal-exercise">
      <h2>Your exercise</h2>
      <p id="reveal-exercise-text"></p>
    </section>

    <section id="reveal-code" hidden>
      <div>
        <h2>Your code</h2>
        <pre id="reveal-student-code"></pre>
      </div>
      <div>
        <h2>Reference solution</h2>
        <pre id="reveal-solution-code"></pre>
      </div>
    </section>

    <section id="reveal-feedback" hidden>
      <h2>How they compare</h2>
      <p id="reveal-comparison"></p>
      <h2>The idea behind the reference</h2>
      <p id="reveal-explanation"></p>
      <h2>Your journey</h2>
      <p id="reveal-recap"></p>
      <button type="button" id="reveal-finish-btn">Finish and start a new exercise</button>
    </section>

    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#reveal-exercise-text").textContent = exercise.exerciseText;
  logOut("#reveal-error");
  loadReveal(exercise);
  setupFinishButton(exercise);
};

const loadReveal = async (exercise: Exercise) => {
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

    findElement<HTMLElement>("#reveal-loading").hidden = true;
    findElement<HTMLElement>("#reveal-code").hidden = false;
    findElement<HTMLElement>("#reveal-feedback").hidden = false;
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
