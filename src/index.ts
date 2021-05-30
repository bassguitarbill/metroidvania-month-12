import { initializeCanvas } from "./canvas.js";
import Game from "./Game.js";

window.addEventListener('load', async () => {
  initializeCanvas();
  (await Game.load()).run();
});