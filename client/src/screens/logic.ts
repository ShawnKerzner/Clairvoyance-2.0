import { app, findElement, showError, showScreen } from "../app.ts";
import { logOut } from "../navigation.ts";
import { postJson } from "../api.ts";
import { showMessage, setBusy, handleAuthErrors, setupExitLink, stageRow, setupStudyScreen } from "../screenHelpers.ts";
import { renderImplementation } from "./implementation.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
};

export const renderLogic = (exercise: Exercise) => {
  app.innerHTML = `
    ${stageRow("plan")}
    <div class="stage-page">
      <div class="stage-grid">
        <aside class="panel" id="logic-exercise">
          <p class="panel-label">Your exercise</p>
          <p class="exercise-text" id="logic-exercise-text"></p>
          <section class="panel-section" id="logic-plan">
            <p class="panel-label">Your plan</p>
            <p class="plan-empty">Your steps will appear here.</p>
            <ol class="plan-list" id="logic-steps"></ol>
          </section>
        </aside>

        <main class="card task" id="logic-task">
          <h1>Plan your steps</h1>
          <p class="reassure">Hints are free: they never use up your attempts.</p>
          <p id="logic-error" class="auth-error"></p>
          <form id="logic-form" class="task-form">
            <p id="logic-feedback" hidden></p>
            <p id="logic-hint" hidden></p>
            <label for="logic-input" id="logic-label" class="task-question">What's your next step? Say what happens and which tool you'll use.</label>
            <textarea id="logic-input" rows="4" placeholder="Go through each number with a for loop and..."></textarea>
            <div class="task-row">
              <p id="logic-attempt">Attempt 1 of 5</p>
              <div class="task-actions">
                <button type="button" id="logic-skip-btn" hidden>Skip this case</button>
                <button type="button" id="logic-hint-btn">Get a hint</button>
                <button type="submit">Add step</button>
              </div>
            </div>
            <button type="button" id="logic-done-btn" class="wide-secondary">I'm done planning</button>
          </form>
          <div class="key-footer">
            <a href="#" id="exit-exercise-link">Exit exercise</a>
            <a href="#" id="logout-link">Log out</a>
          </div>
        </main>
      </div>
    </div>
  `;
  findElement("#logic-exercise-text").textContent = exercise.exerciseText;
  logOut("#logic-error");
  setupExitLink(exercise.id, "#logic-error");
  showLogicState(exercise.progress.logic);
  setupLogicForm(exercise);
  setupSkipButton(exercise);
  setupLogicHintButton(exercise);
  setupDoneButton(exercise);
  setupStudyScreen();
};

let answeringEdgeCase = false;

const showLogicState = (logic: Record<string, any> | undefined) => {
  const steps: string[] = logic?.steps ?? [];
  const pending = logic?.pendingEdgeCase ?? null;
  answeringEdgeCase = pending !== null;

  const list = findElement("#logic-steps");
  list.innerHTML = "";
  for (const step of steps) {
    const item = document.createElement("li");
    item.textContent = step;
    list.appendChild(item);
  }

  const label = findElement("#logic-label");
  const submitButton = findElement<HTMLButtonElement>(
    "#logic-form button[type=submit]",
  );
  const skipButton = findElement<HTMLButtonElement>("#logic-skip-btn");
  const doneButton = findElement<HTMLButtonElement>("#logic-done-btn");

  if (pending) {
    label.textContent = pending.question;
    submitButton.textContent = "Answer";
    skipButton.hidden = pending.required;
    doneButton.hidden = true;
    findElement("#logic-attempt").textContent =
      `Attempt ${pending.attempts.length + 1} of 5`;
  } else {
    label.textContent =
      "What's your next step? Say what happens and which tool you'll use.";
    submitButton.textContent = "Add step";
    skipButton.hidden = true;
    doneButton.hidden = false;
    const attemptsUsed = logic?.current?.attempts.length ?? 0;
    findElement("#logic-attempt").textContent =
      `Attempt ${attemptsUsed + 1} of 5`;
  }
};

const refreshLogic = async () => {
  const response = await fetch("/api/exercises/current");
  const data = await response.json();
  showLogicState(data.exercise?.progress.logic);
};

const setupLogicForm = (exercise: Exercise) => {
  findElement("#logic-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = findElement<HTMLTextAreaElement>("#logic-input");
    showError("#logic-error", "");
    setBusy(true);

    try {
      const response = answeringEdgeCase
        ? await postJson(`/api/exercises/${exercise.id}/logic/edge-case`, {
            answer: input.value,
          })
        : await postJson(`/api/exercises/${exercise.id}/logic/step`, {
            stepText: input.value,
          });
      if (handleAuthErrors(response)) return;
      const data = await response.json();

      if (!response.ok) {
        showError("#logic-error", data.Error);
        return;
      }

      if (data.status === "WEAK") {
        showMessage("#logic-feedback", data.feedback);
        findElement("#logic-attempt").textContent =
          `Attempt ${data.attemptNumber} of 5`;
        return;
      }

      input.value = "";
      showMessage(
        "#logic-feedback",
        data.status === "SOLID" ? "Step added." : data.note,
      );
      await refreshLogic();
    } catch {
      showError("#logic-error", "Can't reach the server, please try again.");
    } finally {
      if (document.querySelector("#logic-form")) setBusy(false);
    }
  });
};

const setupSkipButton = (exercise: Exercise) => {
  findElement("#logic-skip-btn").addEventListener("click", async () => {
    setBusy(true);
    try {
      const response = await postJson(
        `/api/exercises/${exercise.id}/logic/edge-case`,
        { skip: true },
      );
      if (handleAuthErrors(response)) return;
      const data = await response.json();
      if (!response.ok) {
        showError("#logic-error", data.Error);
        return;
      }
      showMessage(
        "#logic-feedback",
        "Skipped. You'll see this case again in your final review.",
      );
      await refreshLogic();
    } catch {
      showError("#logic-error", "Can't reach the server, please try again.");
    } finally {
      if (document.querySelector("#logic-form")) setBusy(false);
    }
  });
};

const setupLogicHintButton = (exercise: Exercise) => {
  findElement("#logic-hint-btn").addEventListener("click", async () => {
    setBusy(true);
    try {
      const response = await postJson(`/api/exercises/${exercise.id}/hint`, {});
      if (handleAuthErrors(response)) return;
      const data = await response.json();
      if (!response.ok) {
        showError("#logic-error", data.Error);
        return;
      }
      showMessage("#logic-hint", `Hint: ${data.hint}`);
    } catch {
      showError("#logic-error", "Can't reach the server, please try again.");
    } finally {
      if (document.querySelector("#logic-form")) setBusy(false);
    }
  });
};

const setupDoneButton = (exercise: Exercise) => {
  findElement("#logic-done-btn").addEventListener("click", async () => {
    showMessage("#logic-feedback", "Checking your whole plan…");
    setBusy(true);
    try {
      const response = await postJson(
        `/api/exercises/${exercise.id}/logic/done`,
        {},
      );
      if (handleAuthErrors(response)) return;
      const data = await response.json();
      if (!response.ok) {
        showError("#logic-error", data.Error);
        return;
      }
      if (data.status === "INCOMPLETE") {
        showMessage("#logic-feedback", data.feedback);
        return;
      }
      showMessage(
        "#logic-feedback",
        "Your plan is complete! Moving on to writing the code…",
      );
      setTimeout(() => showScreen(() => renderImplementation(exercise)), 2000);
    } catch {
      showError("#logic-error", "Can't reach the server, please try again.");
    } finally {
      if (document.querySelector("#logic-form")) setBusy(false);
    }
  });
};
