import { sendUserInfo } from "../api.ts";
import { app, showScreen, findElement, showError } from "../app.ts";
import { showNextScreen } from "../navigation.ts";
import { renderLogin } from "./login.ts";

export const renderSignup = () => {
  app.innerHTML = `
  <h1>Create An Account</h1>
  <p id ="signup-error"></p>
  <form id ="signup-form">
        <input type="text" id="username-signup" placeholder="Username" />
        <input type="password" id="password-signup" placeholder="Password" />
        <input type="password" id="password-signup-confirm" placeholder="Confirm your password"/>
        <button type="submit" id="signup-btn">Create Account</button>
    </form>
    <p id="existing-account-line">Already have an account? <a href="#" id="login-link">Click here to login</a>.</p>
    `;
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
      const response = await sendUserInfo("/api/auth/signup", newAccountInfo);
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
