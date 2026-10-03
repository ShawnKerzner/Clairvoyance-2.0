import './style.css'

const app = document.querySelector("#app");

if (!app) {
  throw new Error("Couldn't find the #app element")
};

const showScreen = (renderScreen: ()=> void) => {
  app.innerHTML = "";
  renderScreen();
};