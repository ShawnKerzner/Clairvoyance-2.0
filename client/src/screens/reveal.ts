import { app, findElement } from "../app.ts";
import { logOut } from "../navigation.ts";

export const renderReveal = (exercise: {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
}) => {
  app.innerHTML = `
    <h1>Final Reveal</h1>
    <p id="reveal-error"></p>
    <p id="reveal-exercise-text"></p>
    <p>This stage is coming next.</p>
    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#reveal-exercise-text").textContent = exercise.exerciseText;
  logOut("#reveal-error");
};
