export const findElement = <T extends Element>(selector: string): T => {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Couldn't find ${selector}`);
    }
    return element
};

export const app = findElement("#app");

 export const showScreen = (renderScreen: ()=> void) => {
  app.innerHTML = "";
  renderScreen();
};

