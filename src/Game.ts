import Entity from "./Entity.js";
import GameMap from "./GameMap.js";
import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH, SCALE } from './canvas.js';
import Player from "./Player.js";
import { Vector2 } from "./math.js";

const BIG_TICK = 100;

const TILE_SIZE = 16;

export { TILE_SIZE };

export default class Game {
  entities: Array<Entity> = [];
  ctx: CanvasRenderingContext2D;
  timestamp: number = 0;
  
  gameMap?: GameMap;

  player: Player;

  constructor() {
    const canvas = document.querySelector('canvas')!;
    this.ctx = canvas.getContext('2d')!;

    this.player = new Player(this, new Vector2(128, 64));

    this.tick = this.tick.bind(this);
  }

  addEntity(entity: Entity) {
    this.entities.push(entity);
  }

  removeEntity(entity: Entity) {
    const index = this.entities.findIndex(e => e === entity)
    if (index > -1) this.entities.splice(index, 1);
  }

  async run() {
    this.gameMap = await GameMap.loadInstance('../maps/spaceColony.json');
    requestAnimationFrame(this.tick);
  }

  tick(timestamp: number) {
    const dt = Math.min(timestamp - this.timestamp, BIG_TICK);

    this.timestamp = timestamp;

    this.entities.forEach(e => e.tick(dt));

    this.ctx.fillStyle = '#cbd1be';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.scale(SCALE, SCALE);
    this.ctx.translate(-this.player.x + (PLAYFIELD_WIDTH/2), -this.player.y + (PLAYFIELD_HEIGHT/2));
    if (this.gameMap) this.gameMap.draw(this.ctx, this);
    this.entities.forEach(e => e.draw(this.ctx));
    this.ctx.translate(this.player.x - (PLAYFIELD_WIDTH/2), this.player.y - (PLAYFIELD_HEIGHT/2));
    this.ctx.scale(1/SCALE, 1/SCALE);

    requestAnimationFrame(this.tick);
  }
}