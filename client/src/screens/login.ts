import { app, showScreen, findElement } from '../app.ts';
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
    <p id="no-account-line">Don't have an account? <a href="#" id="signup-link">Register Here</a>.</p>
    `
    setupSignupLink();
    setupLoginForm();
}

const setupSignupLink = () => {
    const signupLink = findElement('#signup-link')
    signupLink.addEventListener("click", () => {
        showScreen(renderSignup);
    })
}


const setupLoginForm = () => {
    const loginForm = findElement('#login-form');
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const result = readLoginForm();
        try {
             const response = await sendUserInfo(result);
            if(!response.ok) {
            const data = await response.json();
            showLoginError(data.Error)}
        } catch (error) {
            showLoginError("Can't reach the server, please try again")
        };
    });
}

const readLoginForm = () => {
    const usernameLogin = findElement<HTMLInputElement>('#username-login');
    const passwordLogin = findElement<HTMLInputElement>('#password-login');
    const userInfoLogin = {
        username: usernameLogin.value,
        password: passwordLogin.value
    };
    return userInfoLogin;
}

const sendUserInfo = async (credentials: {username: string; password: string}) => {
    const response = await fetch('/api/auth/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    return response;
}

const showLoginError = (message: string) => {
    const loginErrorElement = findElement('#login-error');
    loginErrorElement.textContent = message
}