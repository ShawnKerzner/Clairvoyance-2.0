import { findElement, showError, showScreen } from "./app.ts";
import { renderLogin } from "./screens/login.ts";
import { renderApiKey } from "./screens/apiKey.ts";
import { renderExerciseIntake } from "./screens/intake.ts";
import { postJson } from "./api.ts";

export const showMessage = (selector: string, text: string) => {
  const element = findElement<HTMLElement>(selector);
  element.textContent = text;
  element.hidden = false;
};

export const setBusy = (busy: boolean) => {
  document
    .querySelectorAll<HTMLButtonElement>("#app button")
    .forEach((button) => {
      button.disabled = busy;
    });
};

export const handleAuthErrors = (response: Response) => {
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

// "Exit exercise" link: the first click asks for confirmation, a second click within 4 seconds exits
export const setupExitLink = (exerciseId: number, errorSelector: string) => {
  const link = findElement<HTMLAnchorElement>("#exit-exercise-link");
  const label = link.textContent ?? "Exit exercise";
  let armed = false;
  let resetTimer: number | undefined;

  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!armed) {
      armed = true;
      link.textContent = "Click again to exit. Your progress will be lost.";
      resetTimer = window.setTimeout(() => {
        armed = false;
        link.textContent = label;
      }, 4000);
      return;
    }
    window.clearTimeout(resetTimer);
    try {
      const response = await postJson(`/api/exercises/${exerciseId}/exit`, {});
      if (handleAuthErrors(response)) return;
      if (!response.ok) {
        const data = await response.json();
        showError(errorSelector, data.Error);
        return;
      }
      showScreen(renderExerciseIntake);
    } catch {
      showError(errorSelector, "Can't reach the server, please try again.");
    }
  });
};
