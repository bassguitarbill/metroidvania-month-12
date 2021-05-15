import Entity from "./Entity.js";
import GameMap from "./World.js";
import { SCALE } from './canvas.js';

export default class Game {
  entities: Array<Entity> = [];
  ctx: CanvasRenderingContext2D;
  timestamp: number = 0;
  
  gameMap?: GameMap;

  constructor() {
    const canvas = document.querySelector('canvas')!;
    this.ctx = canvas.getContext('2d')!;

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
    this.gameMap = await GameMap.loadInstance('../maps/testmap.json');
    requestAnimationFrame(this.tick);
  }

  tick(timestamp: number) {
    const dt = timestamp - this.timestamp;
    this.timestamp = timestamp;


    this.entities.forEach(e => e.tick(dt));

    this.ctx.scale(SCALE, SCALE);
    if (this.gameMap) this.gameMap.draw(this.ctx);
    this.entities.forEach(e => e.draw(this.ctx));
    this.ctx.scale(1/SCALE, 1/SCALE);
  }
}