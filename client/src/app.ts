import { setSkyMode } from "./sky.ts";
export const findElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Couldn't find ${selector}`);
  }
  return element;
};

export const app = findElement("#app");

export const showScreen = (renderScreen: () => void) => {
  setSkyMode("full");
  app.innerHTML = "";
  renderScreen();
};

export const showError = (selector: string, errorMessage: string) => {
  const errorElement = findElement(selector);
  errorElement.textContent = errorMessage;
};
