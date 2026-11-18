import { app, findElement } from "../app.ts";
import { logOut } from "../navigation.ts";
import { showError } from "../app.ts";
import { postJson } from "../api.ts";
import { renderUnderstanding } from "./understanding.ts";
import { showScreen } from "../app.ts";
import { renderLogin } from "./login.ts";
import { renderApiKey } from "./apiKey.ts";

export const renderExerciseIntake = () => {
  app.innerHTML = `
    <h1>Copy and paste your exercise into the box below</h1>
    <p id="exercise-intake-error"></p>
        <p id="exercise-intake-loading" hidden>Preparing your exercise… Claude is reading it and getting everything ready. This can take up to a minute.</p>

    <section id="exercise-section">
      <form id="intake-form">
        <label for="language-selector">Select a language</label>
        <select id="language-selector">
          <option value="python">Python</option>
          <option value="javascript">Javascript</option>
        </select>

        <label for="exercise-intake">Paste your exercise below</label>
        <textarea id="exercise-intake" rows="12" placeholder="e.g. Write a function that returns the largest number in an array..."></textarea>

        <button type="submit">Start Exercise</button>
      </form>
    </section>

    <section id="clarification-section" hidden>
      <p id="clarification-question"></p>
      <form id="clarification-form">
        <label for="clarification-answer">Your answer</label>
        <textarea id="clarification-answer" rows="3"></textarea>
        <button type="submit">Continue</button>
      </form>
      <button type="button" id="edit-exercise-btn">Edit exercise</button>
    </section>
    <a href="#" id="logout-link">Logout</a>
    `;
  setupIntakeForm();
  setupClarificationForm();
  setupEditExercise();
  logOut("#exercise-intake-error");
};

const readIntakeForm = () => {
  const language = findElement<HTMLSelectElement>("#language-selector").value;
  const exerciseIntake =
    findElement<HTMLTextAreaElement>("#exercise-intake").value;
  const exerciseIntakeInfo = {
    language: language,
    exerciseText: exerciseIntake,
  };
  return exerciseIntakeInfo;
};

let pendingQuestion = "";

const setExerciseLocked = (locked: boolean) => {
  findElement<HTMLTextAreaElement>("#exercise-intake").readOnly = locked;
  findElement<HTMLElement>('label[for="language-selector"]').hidden = locked;
  findElement<HTMLSelectElement>("#language-selector").hidden = locked;
  findElement<HTMLElement>('label[for="exercise-intake"]').hidden = locked;
  findElement<HTMLButtonElement>("#intake-form button").hidden = locked;
  findElement<HTMLElement>("#clarification-section").hidden = !locked;
};

const showClarification = (question: string) => {
  pendingQuestion = question;
  findElement("#clarification-question").textContent = question;
  setExerciseLocked(true);
};

const setLoading = (loading: boolean) => {
  findElement<HTMLElement>("#exercise-intake-loading").hidden = !loading;
  document
    .querySelectorAll<HTMLButtonElement>("#app button")
    .forEach((button) => {
      button.disabled = loading;
    });
};

const submitExercise = async (body: object) => {
  showError("#exercise-intake-error", "");
  setLoading(true);

  try {
    const response = await postJson("/api/exercises", body);

    if (response.status === 401) {
      showScreen(renderLogin);
      showError("#login-error", "Your session expired. Please log in again.");
      return;
    }

    if (response.status === 403) {
      showScreen(renderApiKey);
      showError(
        "#api-error",
        "Please connect your API key to start an exercise.",
      );
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      showError("#exercise-intake-error", data.Error);
      return;
    }

    if (data.needsClarification) {
      showClarification(data.question);
      return;
    }

    showScreen(() => renderUnderstanding(data.id, data.assumptions));
  } catch (error) {
    showError(
      "#exercise-intake-error",
      "Can't reach the server, please try again",
    );
  } finally {
    if (document.querySelector("#exercise-intake-loading")) {
      setLoading(false);
    }
  }
};

const setupIntakeForm = () => {
  findElement("#intake-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitExercise(readIntakeForm());
  });
};

const setupClarificationForm = () => {
  findElement("#clarification-form").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      const answer = findElement<HTMLTextAreaElement>(
        "#clarification-answer",
      ).value;

      if (!answer.trim()) {
        showError(
          "#exercise-intake-error",
          "Please answer the question to continue.",
        );
        return;
      }

      await submitExercise({
        ...readIntakeForm(),
        clarification: { question: pendingQuestion, answer },
      });
    },
  );
};
const setupEditExercise = () => {
  findElement("#edit-exercise-btn").addEventListener("click", () => {
    pendingQuestion = "";
    findElement<HTMLTextAreaElement>("#clarification-answer").value = "";
    setExerciseLocked(false);
  });
};
