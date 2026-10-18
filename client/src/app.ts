export const appElement = document.querySelector("#app");

if (!appElement) {
  throw new Error("Couldn't find the #app element")
};

export const app: Element = appElement;

 export const showScreen = (renderScreen: ()=> void) => {
  app.innerHTML = "";
  renderScreen();
};