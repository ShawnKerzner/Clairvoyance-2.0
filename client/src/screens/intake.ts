import { app } from "../app.ts";
import { logOut } from "../navigation.ts";

export const renderExerciseIntake = () => {
  app.innerHTML = `
    <h1>Copy and paste your exercise into the box below</h1>
    <p id="exercise-intake-error"></p>
    <a href="#" id="logout-link">Logout</a>
    `;
  logOut("#exercise-intake-error");
};
