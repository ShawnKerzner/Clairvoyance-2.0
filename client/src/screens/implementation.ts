import { app, findElement } from "../app.ts";
import { logOut } from "../navigation.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
};

export const renderImplementation = (exercise: Exercise) => {
  app.innerHTML = `
    <h1>Implementation</h1>
    <p id="implementation-error"></p>

    <section id="implementation-exercise">
      <h2>Your exercise</h2>
      <p id="implementation-exercise-text"></p>
      <h2>Your plan</h2>
      <ol id="implementation-plan"></ol>
    </section>

    <section id="implementation-task">
      <h2>Your code so far</h2>
      <pre id="implementation-code"></pre>
      <form id="implementation-form">
        <label for="implementation-input" id="implementation-label"></label>
        <textarea id="implementation-input" rows="8"></textarea>
        <p id="implementation-attempt">Attempt 1 of 5</p>
        <p id="implementation-feedback" hidden></p>
        <p id="implementation-hint" hidden></p>
        <button type="submit">Check my code</button>
        <button type="button" id="implementation-hint-btn">Get a hint</button>
      </form>
    </section>

    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#implementation-exercise-text").textContent =
    exercise.exerciseText;
  logOut("#implementation-error");
  showImplementationState(exercise.progress);
};

const showImplementationState = (progress: Record<string, any>) => {
  const plan: string[] = progress.logic?.steps ?? [];
  const impl = progress.implementation;
  const stepIndex: number = impl?.stepIndex ?? 0;

  // The plan, with the current step marked
  const list = findElement("#implementation-plan");
  list.innerHTML = "";
  plan.forEach((step, index) => {
    const item = document.createElement("li");
    item.textContent = index === stepIndex ? `👉 ${step}` : step;
    list.appendChild(item);
  });

  findElement("#implementation-code").textContent =
    impl?.codeSoFar || "(nothing yet: start with your function line)";
  findElement("#implementation-label").textContent =
    `Write the code for step ${stepIndex + 1}: ${plan[stepIndex] ?? ""}`;
  const attemptsUsed = impl?.current?.attempts.length ?? 0;
  findElement("#implementation-attempt").textContent =
    `Attempt ${attemptsUsed + 1} of 5`;
};
