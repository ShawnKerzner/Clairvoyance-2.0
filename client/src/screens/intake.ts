import { app, findElement } from "../app.ts";
import { logOut } from "../navigation.ts";
import { showError } from "../app.ts";
import { postJson } from "../api.ts";
import { renderUnderstanding } from "./understanding.ts";
import { showScreen } from "../app.ts";
import { renderLogin } from "./login.ts";
import { renderApiKey } from "./apiKey.ts";
import { createNova } from "../nova.ts";

export const renderExerciseIntake = () => {
  app.innerHTML = `
    <div class="auth-page">
      <main class="card intake-card">
        <h1 class="intake-title">New exercise</h1>
        <p id="exercise-intake-error" class="auth-error"></p>
        <div id="exercise-intake-loading" class="loading-state" hidden>
          <canvas class="loading-nova" id="intake-nova" aria-hidden="true"></canvas>
          <p class="loading-line">Reading your exercise…</p>
          <p class="loading-sub" id="intake-loading-sub">This usually takes 20 to 40 seconds.</p>
        </div>

        <section id="exercise-section">
          <form id="intake-form" class="intake-form">
            <label for="language-selector">Which language will you solve it in?</label>
            <select id="language-selector" class="visually-hidden" tabindex="-1">
              <option value="python">Python</option>
              <option value="javascript">Javascript</option>
            </select>
            <div class="lang-pills" id="lang-pills" role="radiogroup" aria-label="Language">
              <button type="button" class="lang-pill" data-lang="javascript" role="radio">JavaScript</button>
              <button type="button" class="lang-pill" data-lang="python" role="radio">Python</button>
            </div>

            <label for="exercise-intake">Paste your exercise</label>
            <textarea id="exercise-intake" rows="9" placeholder="Write a function that returns the largest number in an array."></textarea>

            <button type="submit">Start exercise</button>
          </form>
        </section>

        <section id="clarification-section" class="clarify" hidden>
          <p class="clarify-label">One quick question</p>
          <p id="clarification-question"></p>
          <form id="clarification-form">
            <label for="clarification-answer">Your answer</label>
            <textarea id="clarification-answer" rows="3"></textarea>
            <button type="submit">Continue</button>
          </form>
          <button type="button" id="edit-exercise-btn" class="text-link">Edit exercise</button>
        </section>

        <div class="key-footer"><span></span><a href="#" id="logout-link">Log out</a></div>
      </main>
    </div>
    `;
  setupLanguagePills();
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
  findElement<HTMLElement>("#lang-pills").hidden = locked;
  findElement<HTMLElement>('label[for="exercise-intake"]').hidden = locked;
  findElement<HTMLButtonElement>('#intake-form button[type="submit"]').hidden = locked;
  findElement<HTMLElement>("#clarification-section").hidden = !locked;
};

const showClarification = (question: string) => {
  pendingQuestion = question;
  findElement("#clarification-question").textContent = question;
  setExerciseLocked(true);
};

const LOADING_LINES = [
  "This usually takes 20 to 40 seconds.",
  "Writing a reference solution you'll see at the end…",
  "Checking it against test cases…",
];
let loadingLineTimer: number | undefined;

// While loading: start a fresh spell (it needs to be visible to size itself) and rotate the quiet line
const startLoadingVisuals = () => {
  const oldCanvas = findElement<HTMLCanvasElement>("#intake-nova");
  const canvas = oldCanvas.cloneNode() as HTMLCanvasElement;
  oldCanvas.replaceWith(canvas);
  createNova(canvas, 1);
  const sub = findElement("#intake-loading-sub");
  let index = 0;
  sub.textContent = LOADING_LINES[0];
  window.clearInterval(loadingLineTimer);
  loadingLineTimer = window.setInterval(() => {
    if (!sub.isConnected) {
      window.clearInterval(loadingLineTimer);
      return;
    }
    index = (index + 1) % LOADING_LINES.length;
    sub.textContent = LOADING_LINES[index];
  }, 4000);
};

const setLoading = (loading: boolean) => {
  findElement<HTMLElement>("#exercise-intake-loading").hidden = !loading;
  if (loading) startLoadingVisuals();
  else window.clearInterval(loadingLineTimer);
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

    showScreen(() => renderUnderstanding(data));
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

// Language pills: they set the (visually hidden) select, which the form reads as before
const setupLanguagePills = () => {
  const select = findElement<HTMLSelectElement>("#language-selector");
  const pills = document.querySelectorAll<HTMLButtonElement>(".lang-pill");
  const show = () => {
    pills.forEach((pill) => {
      const on = pill.dataset.lang === select.value;
      pill.classList.toggle("on", on);
      pill.setAttribute("aria-checked", String(on));
    });
  };
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      select.value = pill.dataset.lang ?? select.value;
      show();
    });
  });
  show();
};
