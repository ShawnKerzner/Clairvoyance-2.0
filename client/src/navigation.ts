import { findElement, showError, showScreen } from "./app";
import { renderLogin } from "./screens/login";
import { renderExerciseIntake } from "./screens/intake";
import { renderApiKey } from "./screens/apiKey";
import { postJson } from "./api";

export const showNextScreen = async () => {
  try {
    const response = await fetch("/api/api-key");
    if (response.status === 401) {
      showScreen(renderLogin);
      return;
    }
    const data = await response.json();
    if (data.connected) {
      showScreen(renderExerciseIntake);
      return;
    }
    showScreen(renderApiKey);
  } catch {
    showScreen(renderLogin);
  }
};

export const logOut = (errorSelector: string) => {
  const logOutLink = findElement<HTMLAnchorElement>("#logout-link");
  logOutLink.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await postJson("/api/auth/logout", {});
      showScreen(renderLogin);
    } catch (error) {
      showError(errorSelector, "Couldn't log out");
    }
  });
};
