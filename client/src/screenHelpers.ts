import { findElement, showError, showScreen } from "./app.ts";
import { renderLogin } from "./screens/login.ts";
import { renderApiKey } from "./screens/apiKey.ts";
import { renderExerciseIntake } from "./screens/intake.ts";
import { postJson } from "./api.ts";
import { setSkyMode } from "./sky.ts";
import { createNova, type NovaLevel } from "./nova.ts";

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

// The Understand → Plan → Code → Review row shown at the top of every study screen
const STAGES = [
  ["understand", "Understand"],
  ["plan", "Plan"],
  ["code", "Code"],
  ["review", "Review"],
] as const;
export type StageName = (typeof STAGES)[number][0];

export const stageRow = (current: StageName) => {
  const currentIndex = STAGES.findIndex(([key]) => key === current);
  const items = STAGES.map(([, label], index) => {
    const state = index < currentIndex ? "done" : index === currentIndex ? "now" : "";
    return `<span class="stage ${state}">${label}</span>`;
  }).join('<span class="stage-line"></span>');
  return `<nav class="progress" id="stage-row" aria-label="Your progress">${items}</nav>`;
};

// "Attempt 2 of 5" plus five dots; hidden on the first attempt so a fresh screen doesn't feel like a countdown
export const setAttempt = (selector: string, attemptNumber: number) => {
  const element = findElement<HTMLElement>(selector);
  element.classList.add("attempts");
  element.hidden = attemptNumber <= 1;
  element.textContent = `Attempt ${attemptNumber} of 5`;
  for (let i = 1; i <= 5; i++) {
    const dot = document.createElement("i");
    if (i < attemptNumber) dot.className = "used";
    if (i === attemptNumber) dot.className = "current";
    element.appendChild(dot);
  }
};

// "You wrote: …" above the tutor's reply, so the two read as one exchange
export const showYouWrote = (selector: string, text: string) => {
  const element = findElement<HTMLElement>(selector);
  element.textContent = "";
  element.append("You wrote: ");
  const quote = document.createElement("em");
  quote.textContent = text;
  element.appendChild(quote);
  element.hidden = !text;
};

// Study screens: a quieter sky, and the stage row only shows at the very top of the page
export const setupStudyScreen = () => {
  setSkyMode("quiet");
  const row = document.getElementById("stage-row");
  if (!row) return;
  const update = () => {
    if (!row.isConnected) {
      window.removeEventListener("scroll", update);
      return;
    }
    row.classList.toggle("tucked", window.scrollY > 8);
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
};

// A small spell with a short message while Claude checks an answer
export const startChecking = (selector: string, level: NovaLevel, text: string) => {
  const box = findElement<HTMLElement>(selector);
  box.textContent = "";
  const canvas = document.createElement("canvas");
  canvas.className = "checking-nova";
  canvas.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.textContent = text;
  box.append(canvas, label);
  box.hidden = false;
  createNova(canvas, level);
};

export const stopChecking = (selector: string) => {
  const box = document.querySelector<HTMLElement>(selector);
  if (!box) return;
  box.hidden = true;
  box.textContent = "";
};

// A green success message fades away by itself after a few seconds
export const hideSuccessLater = (selector: string) => {
  const element = findElement<HTMLElement>(selector);
  const text = element.textContent;
  window.setTimeout(() => {
    if (element.isConnected && element.classList.contains("success") && element.textContent === text) {
      element.hidden = true;
    }
  }, 3000);
};
