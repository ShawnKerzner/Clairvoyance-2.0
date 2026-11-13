import { showScreen } from "./app";
import { renderLogin } from "./screens/login";
import { renderExerciseIntake } from "./screens/intake";
import { renderApiKey } from "./screens/apiKey";

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
