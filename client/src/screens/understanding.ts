import { app } from "../app.ts";
import { logOut } from "../navigation.ts";
import { findElement } from "../app.ts";

export const renderUnderstanding = (exercise: {
  id: number;
  assumptions: string;
  exerciseText: string;
}) => {
  app.innerHTML = `
    <h1>Understanding Check</h1>
    <p id="understanding-error"></p>

    <section id="understanding-exercise">
      <h2>Your exercise</h2>
      <p id="understanding-exercise-text"></p>
      <p id="understanding-assumptions"></p>
    </section>

    <section id="understanding-task">
      <form id="understanding-form">
        <label for="understanding-answer">In your own words, what is this exercise asking you to do?</label>
        <textarea id="understanding-answer" rows="5" placeholder="e.g. It wants a function that takes... and gives back..."></textarea>
        <p id="understanding-attempt">Attempt 1 of 5</p>
        <p id="understanding-feedback" hidden></p>
        <button type="submit">Check my understanding</button>
        <button type="button" id="understanding-hint-btn">Get a hint</button>
      </form>
    </section>

    <a href="#" id="logout-link">Logout</a>
  `;
  findElement("#understanding-exercise-text").textContent =
    exercise.exerciseText;
  findElement("#understanding-assumptions").textContent = exercise.assumptions;
  logOut("#understanding-error");
};
