import './style.css'
import { app, showScreen } from './app';

const renderLogin = () => {
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
    throw new Error("Couldn't find the #help-link");
  }
  signupLink.addEventListener("click", () => {
    showScreen(renderSignup);
  });
}

const renderSignup = () => {
  app.innerHTML=`
  <h1>Sign Up</h1>
  `
}

showScreen(renderLogin)