import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from "./canvas.js";
import Game from "./Game.js";

export default class Camera {
  translationX: number = 0;
  translationY: number = 0;

  constructor(readonly game: Game) {};

  translateCamera(ctx: CanvasRenderingContext2D) {
    this.translationX = PLAYFIELD_WIDTH/2 - this.game.player.x;
    this.translationY = PLAYFIELD_HEIGHT/2 - this.game.player.y;
    ctx.translate(this.translationX, this.translationY);
  }

  untranslateCamera(ctx: CanvasRenderingContext2D) {
    ctx.translate(-this.translationX, -this.translationY);
  }
}