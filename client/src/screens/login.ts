import { app, showScreen } from '../app.ts';
import { renderSignup } from './signup.ts';

export const renderLogin = () => {
  app.innerHTML = `
  <h1>Log in</h1>
  <p id="login-error"></p>
  <form id ="login-form">
    <input type="text" id="username-login" placeholder="Username" />
    <input type="password" id="password-login" placeholder="Password" />
    <button type="submit" id="login-submit-btn">Log In</button>
  </form>
  <p id="no-account-line">Don't have an account? <a href="#" id ="signup-link">Register Here</a>.</p>
  `
  const signupLink = document.querySelector("#signup-link");
  if (!signupLink) {
    throw new Error("Couldn't find the #signup-link");
  }
  signupLink.addEventListener("click", () => {
    showScreen(renderSignup);
  });
}