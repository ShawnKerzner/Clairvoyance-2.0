import { app, findElement } from "../app.ts";
import { logOut } from "../navigation.ts";

export const renderImplementation = (exercise: {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
}) => {
  app.innerHTML = `
    <h1>Implementation</h1>
    <p id="implementation-error"></p>
    <p id="implementation-exercise-text"></p>
    <p>This stage is coming next.</p>
    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#implementation-exercise-text").textContent =
    exercise.exerciseText;
  logOut("#implementation-error");
};
