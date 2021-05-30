import Entity from "./Entity.js";
import GameMap, { ObjectData } from "./GameMap.js";
import { SCALE } from './canvas.js';
import Player from "./Player.js";
import { Vector2 } from "./math.js";
import Camera from "./Camera.js";
import Turret from "./Turret.js";
import Ag from "./Ag.js";
import GUI from "./GUI.js";

const BIG_TICK = 100;

const TILE_SIZE = 16;

export { TILE_SIZE };

export default class Game {
  entities: Array<Entity> = [];
  ctx: CanvasRenderingContext2D;
  timestamp: number = 0;

  player: Player;
  camera: Camera;
  gui: GUI;

  zoneNumber = -1;

  constructor(readonly gameMap: GameMap) {
    const canvas = document.querySelector('canvas')!;
    this.ctx = canvas.getContext('2d')!;

    this.player = new Player(this, new Vector2(128, 64));
    this.camera = new Camera(this);
    this.gui = new GUI(this);

    this.tick = this.tick.bind(this);
  }

  addEntity(entity: Entity) {
    this.entities.push(entity);
  }

  removeEntity(entity: Entity) {
    const index = this.entities.findIndex(e => e === entity)
    if (index > -1) this.entities.splice(index, 1);
  }

  static async load() {
    const gameMap = await GameMap.loadInstance('../maps/spaceColony.json');
    return new Game(gameMap);
  }

  async run() {
    requestAnimationFrame(this.tick);
  }

  tick(timestamp: number) {
    const dt = Math.min(timestamp - this.timestamp, BIG_TICK);

    this.timestamp = timestamp;

    this.entities.forEach(e => e.tick(dt));

    const currentZone = this.gameMap.getZone(this.player.position)?.zoneNumber;
    if ((currentZone !== undefined) && (this.zoneNumber !== currentZone)) {
      this.zoneNumber = currentZone;
      this.switchZone(currentZone);
    }

    this.ctx.fillStyle = '#579fb4';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.scale(SCALE, SCALE);
    this.camera.translateCamera(this.ctx);
    if (this.gameMap) this.gameMap.draw(this.ctx, this);
    this.entities.forEach(e => e.draw(this.ctx));

    this.camera.untranslateCamera(this.ctx);
    this.gui.draw(this.ctx);
    this.ctx.scale(1/SCALE, 1/SCALE);

    requestAnimationFrame(this.tick);
  }

  switchZone(zoneNumber: number) {
    for (let i = this.entities.length - 1; i >= 0; i --) {
      if (!(this.entities[i] instanceof Player)) this.entities[i].destroy();
    };
    this.gameMap.zoneCollection.getZone(zoneNumber)?.getSpawners().forEach(s => this.spawn(s));
  }

  spawn(spawner: ObjectData) {
    const spawnType = spawner.properties.find(p => p.name === 'spawnType')?.value;
    switch(spawnType) {
      case 'Turret':
        new Turret(this, new Vector2(spawner.x, spawner.y));
        break;
      case 'Ag':
        new Ag(this, new Vector2(spawner.x, spawner.y));
        break;
    }

  }
}