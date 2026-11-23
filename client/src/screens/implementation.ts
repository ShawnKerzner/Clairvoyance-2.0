import { app, findElement, showError, showScreen } from "../app.ts";
import { logOut } from "../navigation.ts";
import { postJson } from "../api.ts";
import { showMessage, setBusy, handleAuthErrors, setupExitLink, stageRow, hideSuccessLater, setupStudyScreen, setAttempt, startChecking, stopChecking } from "../screenHelpers.ts";
import { renderReveal } from "./reveal.ts";

type Exercise = {
  id: number;
  assumptions: string;
  exerciseText: string;
  language?: string;
  progress: Record<string, any>;
};

export const renderImplementation = (exercise: Exercise) => {
  app.innerHTML = `
    ${stageRow("code")}
    <div class="stage-page">
      <div class="stage-grid">
        <aside class="panel" id="implementation-exercise">
          <p class="panel-label">Your exercise</p>
          <p class="exercise-text" id="implementation-exercise-text"></p>
          <section class="panel-section">
            <p class="panel-label">Your plan</p>
            <ol class="plan-list" id="implementation-plan"></ol>
          </section>
        </aside>

        <main class="card task" id="implementation-task">
          <h1 id="implementation-title">Write the code</h1>
          <p class="step-now" id="implementation-step-now"></p>
          <p class="reassure">Hints are free: they never use up your attempts.</p>
          <p id="implementation-error" class="auth-error"></p>
          <span class="code-label">Your code so far</span>
          <pre id="implementation-code" class="code-so-far"></pre>
          <form id="implementation-form" class="task-form">
            <div id="implementation-checking" class="checking" hidden></div>
            <p id="implementation-feedback" class="tutor-msg" hidden></p>
            <p id="implementation-hint" class="hint-msg" hidden></p>
            <div class="label-row">
              <label for="implementation-input" id="implementation-label">Your code for this step (include the code around it)</label>
              <span class="lang-tag" id="implementation-lang"></span>
            </div>
            <textarea id="implementation-input" class="code" rows="8" spellcheck="false"></textarea>
            <div class="tip-row">
              <p class="reassure" id="implementation-tip"></p>
              <button type="button" class="paste-btn" id="implementation-paste-btn">Paste code so far</button>
            </div>
            <div class="task-row">
              <p id="implementation-attempt">Attempt 1 of 5</p>
              <div class="task-actions">
                <button type="button" id="implementation-hint-btn">Get a hint</button>
                <button type="submit">Check my code</button>
              </div>
            </div>
          </form>
          <div class="key-footer">
            <a href="#" id="exit-exercise-link">Exit exercise</a>
            <a href="#" id="logout-link">Log out</a>
          </div>
        </main>
      </div>
    </div>
  `;
  findElement("#implementation-exercise-text").textContent =
    exercise.exerciseText;
  logOut("#implementation-error");
  setupExitLink(exercise.id, "#implementation-error");
  showImplementationState(exercise.progress);
  setupImplementationForm(exercise);
  setupImplementationHintButton(exercise);
  const langTag = findElement<HTMLElement>("#implementation-lang");
  langTag.textContent = exercise.language === "python" ? "Python" : "JavaScript";
  langTag.hidden = !exercise.language;
  setupStudyScreen();
  setupPasteButton();
  setupEditorKeys(exercise.language === "python" ? "    " : "  ");
  findElement("#implementation-tip").textContent =
    "Tab indents. Press Esc, then Tab, to move on to the buttons.";
};

// Editor keys: Tab indents, Shift+Tab outdents, Esc then Tab leaves the editor,
// Enter keeps the line's indentation and adds a level after { ( [ or :
const setupEditorKeys = (indentUnit: string) => {
  const box = findElement<HTMLTextAreaElement>("#implementation-input");
  let escaped = false;

  box.addEventListener("keydown", (event) => {
    const start = box.selectionStart;
    const lineStart = box.value.lastIndexOf("\n", start - 1) + 1;

    if (event.key === "Escape") {
      escaped = true;
      return;
    }

    if (event.key === "Tab") {
      if (escaped) {
        escaped = false;
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        if (box.value.startsWith(indentUnit, lineStart)) {
          box.setRangeText("", lineStart, lineStart + indentUnit.length, "preserve");
          box.selectionStart = box.selectionEnd = Math.max(lineStart, start - indentUnit.length);
        }
      } else {
        box.setRangeText(indentUnit, start, box.selectionEnd, "end");
      }
      return;
    }

    escaped = false;
    if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      const before = box.value.slice(lineStart, start);
      const indent = before.match(/^[ \t]*/)?.[0] ?? "";
      const opens = /[{(\[:]\s*$/.test(before);
      event.preventDefault();
      box.setRangeText("\n" + indent + (opens ? indentUnit : ""), start, box.selectionEnd, "end");
    }
  });
  box.addEventListener("blur", () => {
    escaped = false;
  });
  // "Nice, that step works." only stays until the student starts the next step
  box.addEventListener("input", () => {
    const feedback = findElement<HTMLElement>("#implementation-feedback");
    if (feedback.classList.contains("success")) feedback.hidden = true;
  });
};

// Paste the code so far into the editor: fills an empty editor, otherwise inserts at the cursor
const setupPasteButton = () => {
  findElement("#implementation-paste-btn").addEventListener("click", () => {
    const box = findElement<HTMLTextAreaElement>("#implementation-input");
    const code = findElement<HTMLElement>("#implementation-code").dataset.code ?? "";
    if (!code) return;
    if (!box.value.trim()) box.value = code;
    else box.setRangeText(code, box.selectionStart, box.selectionEnd, "end");
    box.focus();
  });
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
    item.textContent = step;
    item.className =
      index < stepIndex ? "done" : index === stepIndex ? "current" : "upcoming";
    list.appendChild(item);
  });

  const codeBlock = findElement<HTMLElement>("#implementation-code");
  codeBlock.textContent =
    impl?.codeSoFar || "(nothing yet: start with your function line)";
  codeBlock.dataset.code = impl?.codeSoFar ?? "";
  findElement<HTMLElement>("#implementation-paste-btn").hidden = !impl?.codeSoFar;
  findElement("#implementation-title").textContent =
    `Write the code for step ${stepIndex + 1}`;
  findElement("#implementation-step-now").textContent = plan[stepIndex] ?? "";
  const attemptsUsed = impl?.current?.attempts.length ?? 0;
  setAttempt("#implementation-attempt", attemptsUsed + 1);
};

const setupImplementationForm = (exercise: Exercise) => {
  findElement("#implementation-form").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      const input = findElement<HTMLTextAreaElement>("#implementation-input");
      showError("#implementation-error", "");
      findElement("#implementation-feedback").classList.remove("success");
      findElement<HTMLElement>("#implementation-feedback").hidden = true;
      setBusy(true);
      startChecking("#implementation-checking", 3, "Looking at your code…");

      try {
        const response = await postJson(
          `/api/exercises/${exercise.id}/implementation`,
          { code: input.value },
        );
        if (handleAuthErrors(response)) return;
        const data = await response.json();

        if (!response.ok) {
          showError("#implementation-error", data.Error);
          return;
        }

        if (data.status === "WEAK") {
          showMessage("#implementation-feedback", data.feedback);
          setAttempt("#implementation-attempt", data.attemptNumber);
          return;
        }
        input.value = "";
        findElement<HTMLElement>("#implementation-hint").hidden = true;
        showMessage(
          "#implementation-feedback",
          data.status === "SOLID" ? "Nice, that step works." : data.note,
        );
        findElement("#implementation-feedback").classList.add("success");
      hideSuccessLater("#implementation-feedback");
        const current = await fetch("/api/exercises/current");
        const currentData = await current.json();
        if (data.nextStep === null) {
          showMessage(
            "#implementation-feedback",
            "Your code is complete! Let's see how it compares…",
          );
          setTimeout(
            () => showScreen(() => renderReveal(currentData.exercise)),
            2000,
          );
          return;
        }
        showImplementationState(currentData.exercise.progress);
      } catch {
        showError(
          "#implementation-error",
          "Can't reach the server, please try again.",
        );
      } finally {
        if (document.querySelector("#implementation-form")) {
          setBusy(false);
          stopChecking("#implementation-checking");
        }
      }
    },
  );
};

const setupImplementationHintButton = (exercise: Exercise) => {
  findElement("#implementation-hint-btn").addEventListener(
    "click",
    async () => {
      setBusy(true);
      try {
        const response = await postJson(
          `/api/exercises/${exercise.id}/hint`,
          {},
        );
        if (handleAuthErrors(response)) return;
        const data = await response.json();
        if (!response.ok) {
          showError("#implementation-error", data.Error);
          return;
        }
        showMessage("#implementation-hint", `Hint: ${data.hint}`);
      } catch {
        showError(
          "#implementation-error",
          "Can't reach the server, please try again.",
        );
      } finally {
        if (document.querySelector("#implementation-form")) setBusy(false);
      }
    },
  );
};
