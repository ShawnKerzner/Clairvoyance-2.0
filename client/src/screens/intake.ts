import { app } from "../app.ts";
import { logOut } from "../navigation.ts";

export const renderExerciseIntake = () => {
  app.innerHTML = `
    <h1>Copy and paste your exercise into the box below</h1>
    <p id="exercise-intake-error"></p>
    <form id="intake-form">
      <label for="language-selector">Select a language</label>
      <select id="language-selector">
        <option value="python">Python</option>
        <option value="javascript">Javascript</option>
      </select>

      <label for="exercise-intake">Paste your exercise below</label>
      <textarea id="exercise-intake" rows="12" placeholder="e.g. Write a function that returns the largest number in an array..."></textarea>

      <button type="submit">Start Exercise</button>
    </form>
    <a href="#" id="logout-link">Logout</a>
    `;
  logOut("#exercise-intake-error");
};
