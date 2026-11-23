import { app, showScreen, findElement, showError } from "../app.ts";
import { showNextScreen } from "../navigation.ts";
import { renderSignup } from "./signup.ts";
import { postJson } from "../api.ts";
import { createNova } from "../nova.ts";

export const renderLogin = () => {
  app.innerHTML = `
    <div class="auth-page">
      <main class="card auth-card">
        <canvas class="logo-nova" id="logo-nova" aria-hidden="true"></canvas>
        <h1 class="brand-title">Clairvoyance</h1>
        <p class="tagline">Solve coding exercises, one step at a time</p>
        <p id="login-error" class="auth-error"></p>
        <form id="login-form" class="auth-form">
          <label for="username-login">Username</label>
          <input type="text" id="username-login" placeholder="Your username" autocomplete="username" />
          <label for="password-login">Password</label>
          <input type="password" id="password-login" placeholder="Your password" autocomplete="current-password" />
          <button type="submit" id="login-submit-btn">Log in</button>
        </form>
        <p id="no-account-line" class="switch">New here? <a href="#" id="signup-link">Create an account</a></p>
      </main>
    </div>
    `;
  createNova(findElement<HTMLCanvasElement>("#logo-nova"), 0);
  setupSignupLink();
  setupLoginForm();
};

const setupSignupLink = () => {
  const signupLink = findElement("#signup-link");
  signupLink.addEventListener("click", () => {
    showScreen(renderSignup);
  });
};

const setupLoginForm = () => {
  const loginForm = findElement("#login-form");
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = readLoginForm();
    try {
      const response = await postJson("/api/auth/login", result);
      if (!response.ok) {
        const data = await response.json();
        showError("#login-error", data.Error);
        return;
      }
      showNextScreen();
    } catch (error) {
      showError("#login-error", "Can't reach the server, please try again");
    }
  });
};

const readLoginForm = () => {
  const usernameLogin = findElement<HTMLInputElement>("#username-login");
  const passwordLogin = findElement<HTMLInputElement>("#password-login");
  const userInfoLogin = {
    username: usernameLogin.value,
    password: passwordLogin.value,
  };
  return userInfoLogin;
};
