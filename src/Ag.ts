import AABBHitbox from "./AABBHitbox.js";
import Entity from "./Entity.js";
import { Vector2 } from "./math.js";
import Spritesheet from "./Spritesheet.js";

export default class Ag extends Entity {
  static spritesheet: Spritesheet;

  static async load() {
    Ag.spritesheet = await Spritesheet.load('assets/images/enemy-ag.png', 36, 26);
    await AgBump.load();
  }

  hitbox: AABBHitbox = new AABBHitbox(new Vector2(5, 5), new Vector2(30, 20));
  velocity = new Vector2(.1, 0);
  animationTimer = 0;

  tick(dt: number) {
    this.animationTimer += dt;
    this.hitbox.offset = this.position;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y;
    if (this.game.gameMap?.collides(this.hitbox)) this.reverseDirection(dt);
    if (!this.game.player.isInvincible && this.hitbox.collides(this.game.player.hitbox)) {
      this.game.player.damage(1);
      new AgBump(this.game, this.position);
    }
  }

  reverseDirection(dt: number) {
    this.position.x -= this.velocity.x * dt;
    this.velocity.x *= -1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    Ag.spritesheet.draw(ctx, this.position.x, this.position.y, Math.floor((this.animationTimer / 150) % 2), this.velocity.x > 0 ? 1 : 0);
  }
}

class AgBump extends Entity {
  static spritesheet: Spritesheet;
  static async load() {
    AgBump.spritesheet = await Spritesheet.load('assets/images/ag-bump.png', 36, 26);
  }

  animationTimer = 0;

  tick(dt: number) {
    this.animationTimer += dt;
    if (this.animationTimer > 700) this.destroy();
  }

  draw(ctx: CanvasRenderingContext2D) {
    AgBump.spritesheet.draw(ctx, this.position.x, this.position.y, Math.floor(this.animationTimer / 100), 0);
  }
}