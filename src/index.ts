import { initializeCanvas } from "./canvas.js";
import Game from "./Game.js";

window.addEventListener('load', () => {
  initializeCanvas();
  new Game().run();
});