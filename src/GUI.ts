import Game from "./Game.js";
import { loadImageFrom } from "./load.js";

export default class GUI {
  @loadImageFrom('assets/images/gui-layout.png')
  static image: HTMLImageElement;

  constructor(readonly game: Game) {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(GUI.image, 0, 0);
  }
}