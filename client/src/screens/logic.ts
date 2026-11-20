import { app, findElement } from "../app.ts";
import { logOut } from "../navigation.ts";

export const renderLogic = (exercise: {
  id: number;
  assumptions: string;
  exerciseText: string;
  progress: Record<string, any>;
}) => {
  app.innerHTML = `
    <h1>Logic Walkthrough</h1>
    <p id="logic-error"></p>
    <p id="logic-exercise-text"></p>
    <p>This stage is coming next.</p>
    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#logic-exercise-text").textContent = exercise.exerciseText;
  logOut("#logic-error");
};
