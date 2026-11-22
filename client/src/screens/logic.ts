import { app, findElement } from "../app.ts";
import { logOut } from "../navigation.ts";

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

    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#logic-exercise-text").textContent = exercise.exerciseText;
  logOut("#logic-error");
  showLogicState(exercise.progress.logic);
};

const showLogicState = (logic: Record<string, any> | undefined) => {
  const steps: string[] = logic?.steps ?? [];
  const pending = logic?.pendingEdgeCase ?? null;

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
