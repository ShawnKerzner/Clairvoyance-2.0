import { app, findElement, showError, showScreen } from "../app.ts";
import { logOut } from "../navigation.ts";
import { postJson } from "../api.ts";
import { renderLogic } from "./logic.ts";
import { showMessage, setBusy, handleAuthErrors, setupExitLink, stageRow, setAttempt, showYouWrote, setupStudyScreen, startChecking, stopChecking } from "../screenHelpers.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
};

export const renderUnderstanding = (exercise: Exercise) => {
  app.innerHTML = `
    ${stageRow("understand")}
    <div class="stage-page">
      <div class="stage-grid">
        <aside class="panel" id="understanding-exercise">
          <p class="panel-label">Your exercise</p>
          <p class="exercise-text" id="understanding-exercise-text"></p>
          <p class="assumptions" id="understanding-assumptions"></p>
        </aside>

        <main class="card task" id="understanding-task">
          <h1>What is this exercise asking?</h1>
          <p class="task-prompt">Explain it in your own words: what goes in, and what should come out. You don't need to know how to solve it yet.</p>
          <p class="reassure">Hints are free: they never use up your attempts.</p>
          <p id="understanding-error" class="auth-error"></p>
          <form id="understanding-form" class="task-form">
            <div id="understanding-checking" class="checking" hidden></div>
            <p id="understanding-you-wrote" class="you-wrote" hidden></p>
            <p id="understanding-feedback" class="tutor-msg" hidden></p>
            <p id="understanding-hint" class="hint-msg" hidden></p>
            <label for="understanding-answer">Your explanation</label>
            <textarea id="understanding-answer" rows="5" placeholder="It takes... and gives back..."></textarea>
            <div class="task-row">
              <p id="understanding-attempt">Attempt 1 of 5</p>
              <div class="task-actions">
                <button type="button" id="understanding-hint-btn">Get a hint</button>
                <button type="submit">Check</button>
              </div>
            </div>
          </form>
          <div class="key-footer">
            <a href="#" id="exit-exercise-link">Exit exercise</a>
            <a href="#" id="logout-link">Log out</a>
          </div>
        </main>
      </div>
    </div>
  `;
  findElement("#understanding-exercise-text").textContent =
    exercise.exerciseText;
  findElement("#understanding-assumptions").textContent = exercise.assumptions;
  const attemptsUsed = exercise.progress.understanding?.attempts.length ?? 0;
  setAttempt("#understanding-attempt", attemptsUsed + 1);
  setupUnderstandingForm(exercise);
  setupHintButton(exercise);
  logOut("#understanding-error");
  setupExitLink(exercise.id, "#understanding-error");
  setupStudyScreen();
};

const setupUnderstandingForm = (exercise: Exercise) => {
  findElement("#understanding-form").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      const paraphrase = findElement<HTMLTextAreaElement>(
        "#understanding-answer",
      ).value;
      if (!paraphrase.trim()) {
        showError(
          "#understanding-error",
          "Please explain the exercise in your own words.",
        );
        return;
      }

      showError("#understanding-error", "");
      findElement<HTMLElement>("#understanding-you-wrote").hidden = true;
      findElement("#understanding-feedback").classList.remove("success");
      findElement<HTMLElement>("#understanding-feedback").hidden = true;
      startChecking("#understanding-checking", 1, "Checking your explanation…");
      setBusy(true);

      try {
        const response = await postJson(
          `/api/exercises/${exercise.id}/understanding`,
          { paraphrase },
        );
        if (handleAuthErrors(response)) return;
        const data = await response.json();

        if (!response.ok) {
          showError("#understanding-error", data.Error);
          return;
        }

        if (data.status === "WEAK") {
          showYouWrote("#understanding-you-wrote", paraphrase.trim());
          showMessage("#understanding-feedback", data.feedback);
          setAttempt("#understanding-attempt", data.attemptNumber);
          return;
        }

        findElement("#understanding-feedback").classList.add("success");
        if (data.status === "SOLID") {
          showMessage(
            "#understanding-feedback",
            `Nice, that's it: "${data.paraphrase}"`,
          );
        } else {
          showMessage(
            "#understanding-feedback",
            `${data.note} Here's what the exercise asks: "${data.paraphrase}"`,
          );
        }
        setTimeout(() => showScreen(() => renderLogic(exercise)), 2500);
      } catch {
        showError(
          "#understanding-error",
          "Can't reach the server, please try again.",
        );
      } finally {
        stopChecking("#understanding-checking");
        if (document.querySelector("#understanding-form")) setBusy(false);
      }
    },
  );
};

const setupHintButton = (exercise: Exercise) => {
  findElement("#understanding-hint-btn").addEventListener("click", async () => {
    setBusy(true);
    try {
      const response = await postJson(`/api/exercises/${exercise.id}/hint`, {});
      if (handleAuthErrors(response)) return;
      const data = await response.json();
      if (!response.ok) {
        showError("#understanding-error", data.Error);
        return;
      }
      showMessage("#understanding-hint", `Hint: ${data.hint}`);
    } catch {
      showError(
        "#understanding-error",
        "Can't reach the server, please try again.",
      );
    } finally {
      if (document.querySelector("#understanding-form")) setBusy(false);
    }
  });
};
