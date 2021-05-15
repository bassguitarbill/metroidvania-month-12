import { Vector2 } from "./math.js";

export default class AABBHitbox {
  offset = new Vector2();
  constructor(readonly _topLeft: Vector2, readonly _bottomRight: Vector2){};
  get topLeft(): Vector2 { return Vector2.sumOf(this._topLeft, this.offset)}
  get bottomRight(): Vector2 { return Vector2.sumOf(this._bottomRight, this.offset)}
  draw(ctx: CanvasRenderingContext2D) {
    if (!(window as any).debug) return;
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'red';
    ctx.fillRect(this.topLeft.x, this.topLeft.y, this.bottomRight.x - this.topLeft.x, this.bottomRight.y - this.topLeft.y)
    ctx.globalAlpha = alpha;
  }

  collides(other: AABBHitbox) {
    if (this.topLeft.x > other.bottomRight.x) return false;
    if (this.bottomRight.x < other.topLeft.x) return false;
    if (this.topLeft.y > other.bottomRight.y) return false;
    if (this.bottomRight.y < other.topLeft.y) return false;
    return true;
  }
}