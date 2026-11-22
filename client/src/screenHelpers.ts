import { findElement, showError, showScreen } from "./app.ts";
import { renderLogin } from "./screens/login.ts";
import { renderApiKey } from "./screens/apiKey.ts";

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
