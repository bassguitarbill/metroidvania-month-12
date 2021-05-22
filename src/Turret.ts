import Entity from "./Entity.js";
import Spritesheet from "./Spritesheet.js";

export default class Turret extends Entity {
  static ceilingSpritesheet: Spritesheet;
  timer = 0;

  static async load() {
    Turret.ceilingSpritesheet = await Spritesheet.load('assets/images/ceiling-turret.png', 32, 32);;
  }

  tick(dt: number) {
    this.timer += dt;
  }

  draw(ctx:CanvasRenderingContext2D) {
    const frame = this.timer < 2000 ? 0 : this.timer < 3200 ? Math.floor(((this.timer - 2000) % 1200) / 100) : 11;
    Turret.ceilingSpritesheet.draw(ctx, this.x, this.y, frame, 0 );
  }
}