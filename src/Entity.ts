import AABBHitbox from "./AABBHitbox.js";
import Game from "./Game.js";
import { Vector2 } from "./math.js";

export default class Entity {
  constructor(readonly game: Game, readonly position: Vector2) {
    game.addEntity(this);
  }

  destroy() {
    this.game.removeEntity(this);
  }

  tick(_: number){};
  draw(_: CanvasRenderingContext2D){};
  
  get x() {
    return this.position.x;
  }
  set x(x) {
    this.position.x = x;
  }
  get y() {
    return this.position.y;
  }
  set y(y) {
    this.position.y = y;
  }

  getHitbox(): AABBHitbox | null {
    return null;
  }

  onRelease(): void {}
}