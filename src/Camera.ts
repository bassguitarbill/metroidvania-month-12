import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from "./canvas.js";
import Game from "./Game.js";

export default class Camera {
  translationX: number = 0;
  translationY: number = 0;

  zoneBoundMap: {[key in number]: any} = {};

  constructor(readonly game: Game) {};

  translateCamera(ctx: CanvasRenderingContext2D) {
    const zone = this.game.gameMap.getZone(this.game.player.position);
    if (!zone) {
      this.translationX = PLAYFIELD_WIDTH/2 - this.game.player.x;
      this.translationY = PLAYFIELD_HEIGHT/2 - this.game.player.y;
    } else {
      if (zone.zoneNumber in this.zoneBoundMap) {

      } else {
        const verticallyConstrained = zone.height <= PLAYFIELD_HEIGHT;
        const horizontallyConstrained = zone.width <= PLAYFIELD_WIDTH;
        this.zoneBoundMap[zone.zoneNumber] = {
          verticallyConstrained,
          horizontallyConstrained,
          translationX: horizontallyConstrained ? PLAYFIELD_WIDTH/2 - zone.x - (zone.width / 2) : undefined,
          translationY: verticallyConstrained ? PLAYFIELD_HEIGHT/2 - zone.y - (zone.height / 2) : undefined,
          upperBound: verticallyConstrained ? undefined : -zone.y,
          lowerBound: verticallyConstrained ? undefined : PLAYFIELD_HEIGHT - (zone.y + zone.height),
          leftBound: horizontallyConstrained ? undefined : -zone.x,
          rightBound: horizontallyConstrained ? undefined : PLAYFIELD_WIDTH - (zone.x + zone.width),
        }
      }
      const { verticallyConstrained, horizontallyConstrained, upperBound, lowerBound, leftBound, rightBound, translationX, translationY } = this.zoneBoundMap[zone.zoneNumber];
      if (verticallyConstrained) {
        this.translationY = translationY;
      } else {
        const followPlayer = PLAYFIELD_HEIGHT/2 - this.game.player.y;
        this.translationY = Math.max(Math.min(upperBound, followPlayer), lowerBound);
      }
      if (horizontallyConstrained) {
        this.translationX = translationX
      } else {
        const followPlayer = PLAYFIELD_WIDTH/2 - this.game.player.x;
        this.translationX = Math.max(Math.min(leftBound, followPlayer), rightBound);
      }
    }
    ctx.translate(this.translationX, this.translationY);
  }

  untranslateCamera(ctx: CanvasRenderingContext2D) {
    ctx.translate(-this.translationX, -this.translationY);
  }
}