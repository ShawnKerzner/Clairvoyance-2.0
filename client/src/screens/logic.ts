import { app, findElement, showError, showScreen } from "../app.ts";
import { logOut } from "../navigation.ts";
import { postJson } from "../api.ts";
import { showMessage, setBusy, handleAuthErrors, setupExitLink } from "../screenHelpers.ts";
import { renderImplementation } from "./implementation.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
};

export const renderLogic = (exercise: Exercise) => {
  app.innerHTML = `
    <h1>Logic Walkthrough</h1>
    <p id="logic-error"></p>

    <section id="logic-exercise">
      <h2>Your exercise</h2>
      <p id="logic-exercise-text"></p>
    </section>

    <section id="logic-plan">
      <h2>Your plan</h2>
      <ol id="logic-steps"></ol>
    </section>

    <section id="logic-task">
      <form id="logic-form">
        <label for="logic-input" id="logic-label">What's your next step? Say what happens and which tool you'll use.</label>
        <textarea id="logic-input" rows="4" placeholder="e.g. Go through each number with a for loop and..."></textarea>
        <p id="logic-attempt">Attempt 1 of 5</p>
        <p id="logic-feedback" hidden></p>
        <p id="logic-hint" hidden></p>
        <button type="submit">Add step</button>
        <button type="button" id="logic-skip-btn" hidden>Skip this case</button>
        <button type="button" id="logic-hint-btn">Get a hint</button>
        <button type="button" id="logic-done-btn">I'm done planning</button>
      </form>
    </section>

    <a href="#" id="exit-exercise-link">Exit exercise</a>
    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#logic-exercise-text").textContent = exercise.exerciseText;
  logOut("#logic-error");
  setupExitLink(exercise.id, "#logic-error");
  showLogicState(exercise.progress.logic);
  setupLogicForm(exercise);
  setupSkipButton(exercise);
  setupLogicHintButton(exercise);
  setupDoneButton(exercise);
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
