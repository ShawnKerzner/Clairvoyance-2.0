import { app, showScreen, findElement } from "../app.ts";
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
};

const setupLoginLink = () => {
  const loginLink = findElement("#login-link");
  loginLink.addEventListener("click", () => {
    showScreen(renderLogin);
  });
};
