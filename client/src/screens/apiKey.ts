import { postJson } from "../api.ts";
import { app, findElement, showError, showScreen } from "../app.ts";
import { showNextScreen, logOut } from "../navigation.ts";
import { renderLogin } from "./login.ts";
import { createNova } from "../nova.ts";

export const renderApiKey = () => {
  app.innerHTML = `
    <div class="auth-page">
      <main class="card key-card">
        <div class="key-title-row">
          <canvas class="key-logo" id="key-logo" aria-hidden="true"></canvas>
          <h1>Connect Claude</h1>
        </div>
        <div class="key-dots" aria-hidden="true"><span class="now"></span><span></span><span></span></div>
        <p id="api-error" class="auth-error"></p>

        <section class="key-step active" data-step="1">
          <p class="key-step-label">Step 1 of 3</p>
          <p class="key-step-title">Open the Claude Console and sign in</p>
          <p class="key-step-sub">New account? Add a few dollars of credits under Billing first.</p>
          <a class="key-console-btn" id="console-btn" href="https://platform.claude.com/" target="_blank" rel="noopener noreferrer">Open Claude Console ↗</a>
          <div class="key-nav">
            <button type="button" class="key-link" data-go="3">I already have a key</button>
            <button type="button" class="key-next" data-go="2">Next</button>
          </div>
        </section>

        <section class="key-step" data-step="2">
          <p class="key-step-label">Step 2 of 3</p>
          <p class="key-step-title">Create a key and copy it</p>
          <p class="key-step-sub">In the Console, go to API keys, click Create key, and give it any name.</p>
          <div class="key-nav">
            <button type="button" class="key-link" data-go="1">Back</button>
            <button type="button" class="key-next" data-go="3">Next</button>
          </div>
        </section>

        <section class="key-step" data-step="3">
          <p class="key-step-label">Step 3 of 3</p>
          <p class="key-step-title">Paste your key</p>
          <form id="api-form" class="key-form">
            <div class="key-field">
              <input type="password" id="api-key-input" placeholder="sk-ant-..." autocomplete="off" aria-label="Your API key" />
              <button type="button" class="key-eye" id="key-eye" aria-label="Show key"><svg class="icon eye-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="icon eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.1"/><path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg></button>
            </div>
            <p class="key-hint" id="key-hint"></p>
            <p class="key-privacy"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Your key stays in your browser.</p>
            <button type="submit" id="connect-api-btn">Connect key</button>
          </form>
          <div class="key-nav"><button type="button" class="key-link" data-go="2">Back</button><span></span></div>
        </section>

        <div class="key-footer">
          <a href="#" id="help-toggle">Need help?</a>
          <a href="#" id="logout-link">Log out</a>
        </div>
        <div class="key-help" id="key-help" hidden>
          <ul>
            <li>A Claude Pro or Max subscription doesn't include API access. The API is billed separately with Console credits.</li>
            <li>Your key starts with sk-ant-. The Console only shows it once, so copy it in one go.</li>
            <li>Lost it? Create a new key and paste that one instead.</li>
            <li>Your key is stored only in this browser, in a secure cookie, for 7 days.</li>
            <li>On a shared computer, log out when you're done. Logging out removes your key.</li>
          </ul>
        </div>
      </main>
    </div>
  `;
  createNova(findElement<HTMLCanvasElement>("#key-logo"), 0);
  setupKeySteps();
  setupKeyHelpers();
  setupApiKeyForm();
  logOut("#api-error");
};

const setupApiKeyForm = () => {
  const apiKeyForm = findElement("#api-form");
  const apiInput = findElement<HTMLInputElement>("#api-key-input");
  apiKeyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const response = await postJson("/api/api-key", {
        apiKey: apiInput.value,
      });
      if (response.status === 401) {
        showScreen(renderLogin);
        showError("#login-error", "Your session expired. Please log in again.");
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        showError("#api-error", data.Error);
        return;
      }
      showNextScreen();
    } catch (error) {
      showError("#api-error", "Can't reach the server, please try again");
    }
  });
};

// One step at a time: Next, Back and "I already have a key" switch the visible step
const goToStep = (number: number) => {
  document.querySelectorAll<HTMLElement>(".key-step").forEach((step) => {
    step.classList.toggle("active", Number(step.dataset.step) === number);
  });
  document.querySelectorAll(".key-dots span").forEach((dot, index) => {
    dot.classList.toggle("now", index === number - 1);
    dot.classList.toggle("done", index < number - 1);
  });
  if (number === 3) findElement<HTMLInputElement>("#api-key-input").focus();
};

const setupKeySteps = () => {
  document.querySelectorAll<HTMLButtonElement>("[data-go]").forEach((button) => {
    button.addEventListener("click", () => goToStep(Number(button.dataset.go)));
  });
  findElement("#help-toggle").addEventListener("click", (event) => {
    event.preventDefault();
    const help = findElement<HTMLElement>("#key-help");
    help.hidden = !help.hidden;
  });
};

// Eye toggle, a gentle format hint, and moving to step 2 when the student returns from the Console tab
const setupKeyHelpers = () => {
  const input = findElement<HTMLInputElement>("#api-key-input");
  const eye = findElement<HTMLButtonElement>("#key-eye");
  const hint = findElement("#key-hint");

  eye.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    eye.classList.toggle("showing", hidden);
    eye.setAttribute("aria-label", hidden ? "Hide key" : "Show key");
  });

  input.addEventListener("input", () => {
    const value = input.value.trim();
    const looksWrong = value.length > 0 && !value.startsWith("sk-ant-");
    hint.textContent = looksWrong ? "That doesn't look like an API key yet. It should start with sk-ant-" : "";
    input.classList.toggle("looks-wrong", looksWrong);
  });

  let wentToConsole = false;
  findElement("#console-btn").addEventListener("click", () => {
    wentToConsole = true;
  });
  const onReturn = () => {
    if (!document.contains(input)) {
      window.removeEventListener("focus", onReturn);
      return;
    }
    if (wentToConsole) {
      wentToConsole = false;
      goToStep(2);
    }
  };
  window.addEventListener("focus", onReturn);
};
