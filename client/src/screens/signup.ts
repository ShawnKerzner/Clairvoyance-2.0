import { postJson } from "../api.ts";
import { app, showScreen, findElement, showError } from "../app.ts";
import { showNextScreen } from "../navigation.ts";
import { renderLogin } from "./login.ts";
import { createNova } from "../nova.ts";

export const renderSignup = () => {
  app.innerHTML = `
    <div class="auth-page">
      <main class="card auth-card">
        <canvas class="logo-nova" id="logo-nova" aria-hidden="true"></canvas>
        <h1 class="brand-title">Clairvoyance</h1>
        <p class="tagline">Solve coding exercises, one step at a time</p>
        <p id="signup-error" class="auth-error"></p>
        <form id="signup-form" class="auth-form">
          <label for="username-signup">Username</label>
          <input type="text" id="username-signup" placeholder="Choose a username" autocomplete="username" />
          <label for="password-signup">Password</label>
          <input type="password" id="password-signup" placeholder="Choose a password" autocomplete="new-password" />
          <label for="password-signup-confirm">Confirm password</label>
          <input type="password" id="password-signup-confirm" placeholder="Type it again" autocomplete="new-password" />
          <button type="submit" id="signup-btn">Create account</button>
        </form>
        <p id="existing-account-line" class="switch">Already have an account? <a href="#" id="login-link">Log in</a></p>
      </main>
    </div>
    `;
  createNova(findElement<HTMLCanvasElement>("#logo-nova"), 0);
  setupLoginLink();
  setupSignUpForm();
};

const setupLoginLink = () => {
  const loginLink = findElement("#login-link");
  loginLink.addEventListener("click", () => {
    showScreen(renderLogin);
  });
};

const setupSignUpForm = () => {
  const signupForm = findElement("#signup-form");
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = readSignupForm();
    if (result.password !== result.confirmPassword) {
      showError("#signup-error", "Passwords do not match");
      return;
    }
    const newAccountInfo = {
      username: result.username,
      password: result.password,
    };
    try {
      const response = await postJson("/api/auth/signup", newAccountInfo);
      if (!response.ok) {
        const data = await response.json();
        showError("#signup-error", data.Error);
        return;
      }
      showNextScreen();
    } catch (error) {
      showError("#signup-error", "Can't reach the server, please try again");
    }
  });
};

const readSignupForm = () => {
  const usernameSignup = findElement<HTMLInputElement>("#username-signup");
  const passwordSignup = findElement<HTMLInputElement>("#password-signup");
  const passwordSignupConfirm = findElement<HTMLInputElement>(
    "#password-signup-confirm",
  );
  const userInfoSignup = {
    username: usernameSignup.value,
    password: passwordSignup.value,
    confirmPassword: passwordSignupConfirm.value,
  };
  return userInfoSignup;
};
