import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from "./canvas.js";
import Game from "./Game.js";

export default class Camera {
  translationX: number = 0;
  translationY: number = 0;

  constructor(readonly game: Game) {};

  translateCamera(ctx: CanvasRenderingContext2D) {
    const zone = this.game.gameMap!.getZone(this.game.player.position);
    if (!zone) {
      this.translationX = PLAYFIELD_WIDTH/2 - this.game.player.x;
      this.translationY = PLAYFIELD_HEIGHT/2 - this.game.player.y;
    } else {
      const verticallyConstrained = zone.height <= PLAYFIELD_HEIGHT;
      const horizontallyConstrained = zone.width <= PLAYFIELD_WIDTH;
      if (verticallyConstrained) {
        this.translationY = PLAYFIELD_HEIGHT/2 - zone.y - (zone.height / 2);
      } else {
        this.translationY = PLAYFIELD_HEIGHT/2 - this.game.player.y;
      }
      if (horizontallyConstrained) {
        this.translationX = PLAYFIELD_WIDTH/2 - zone.x - (zone.width / 2);
      } else {
        this.translationX = PLAYFIELD_WIDTH/2 - this.game.player.x;
      }
    }
    ctx.translate(this.translationX, this.translationY);
  }

  untranslateCamera(ctx: CanvasRenderingContext2D) {
    ctx.translate(-this.translationX, -this.translationY);
  }
}