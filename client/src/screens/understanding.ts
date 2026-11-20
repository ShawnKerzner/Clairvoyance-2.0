import { app, findElement, showError, showScreen } from "../app.ts";
import { logOut } from "../navigation.ts";
import { postJson } from "../api.ts";
import { renderLogin } from "./login.ts";
import { renderApiKey } from "./apiKey.ts";
import { renderLogic } from "./logic.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
};

export const renderUnderstanding = (exercise: Exercise) => {
  app.innerHTML = `
    <h1>Understanding Check</h1>
    <p id="understanding-error"></p>

    <section id="understanding-exercise">
      <h2>Your exercise</h2>
      <p id="understanding-exercise-text"></p>
      <p id="understanding-assumptions"></p>
    </section>

    <section id="understanding-task">
      <form id="understanding-form">
        <label for="understanding-answer">In your own words, what is this exercise asking you to do?</label>
        <textarea id="understanding-answer" rows="5" placeholder="e.g. It wants a function that takes... and gives back..."></textarea>
        <p id="understanding-attempt">Attempt 1 of 5</p>
        <p id="understanding-feedback" hidden></p>
        <p id="understanding-hint" hidden></p>
        <button type="submit">Check my understanding</button>
        <button type="button" id="understanding-hint-btn">Get a hint</button>
      </form>
    </section>

    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#understanding-exercise-text").textContent =
    exercise.exerciseText;
  findElement("#understanding-assumptions").textContent = exercise.assumptions;
  const attemptsUsed = exercise.progress.understanding?.attempts.length ?? 0;
  findElement("#understanding-attempt").textContent =
    `Attempt ${attemptsUsed + 1} of 5`;
  setupUnderstandingForm(exercise);
  setupHintButton(exercise);
  logOut("#understanding-error");
};

// Shows a message in one of the screen's text areas
const showMessage = (selector: string, text: string) => {
  const element = findElement<HTMLElement>(selector);
  element.textContent = text;
  element.hidden = false;
};

// Disables every button while a request is running
const setBusy = (busy: boolean) => {
  document
    .querySelectorAll<HTMLButtonElement>("#app button")
    .forEach((button) => {
      button.disabled = busy;
    });
};

// Handles the responses every request on this screen can share
const handleAuthErrors = (response: Response) => {
  if (response.status === 401) {
    showScreen(renderLogin);
    showError("#login-error", "Your session expired. Please log in again.");
    return true;
  }
  if (response.status === 403) {
    showScreen(renderApiKey);
    showError("#api-error", "Please connect your API key to continue.");
    return true;
  }
  return false;
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
      showMessage("#understanding-feedback", "Checking your explanation…");
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
          showMessage("#understanding-feedback", data.feedback);
          findElement("#understanding-attempt").textContent =
            `Attempt ${data.attemptNumber} of 5`;
          return;
        }

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
