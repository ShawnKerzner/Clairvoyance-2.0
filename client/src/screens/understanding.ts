import { app } from "../app.ts";
import { logOut } from "../navigation.ts";
import { findElement } from "../app.ts";

export const renderUnderstanding = (
  exerciseId: number,
  assumptions: string,
) => {
  app.innerHTML = `
    <h1>Understanding Check</h1>
    <p id="understanding-error"></p>
    <p id="understanding-assumptions"></p>
    <p>Exercise #<span id="understanding-exercise-id"></span> is ready. This stage is coming next.</p>
    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#understanding-exercise-id").textContent = String(exerciseId);
  findElement("#understanding-assumptions").textContent = assumptions;
  logOut("#understanding-error");
};
