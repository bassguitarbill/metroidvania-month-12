import Entity from "./Entity.js";
import Game from "./Game.js";
import { Vector2 } from "./math.js";
import Spritesheet from "./Spritesheet.js";
import StateMachine from "./StateMachine.js";

const EMERGE_TIME = 1200;
const AIM_TIME = 400;
const BURST_COOLDOWN_TIME = 500;
const COOLDOWN_TIME = 3000;

export default class Turret extends Entity {
  static ceilingSpritesheet: Spritesheet;

  static async load() {
    Turret.ceilingSpritesheet = await Spritesheet.load('assets/images/ceiling-turret.png', 32, 32);;
  }

  timer = 0;
  timerCallback = () => {};

  burstCounter = 3;

  animationFrame = 0;
  readonly stateMachine: StateMachine<TurretState>;

  constructor(game: Game, position: Vector2) {
    super(game, position);
    this.stateMachine = new StateMachine(TurretState.INIT);
    this.populateStateMachine();
  }

  tick(dt: number) {
    const timerFired = this.timer <= 0;
    this.timer -= dt;
    if (!timerFired && this.timer <= 0) {
      this.timerCallback();
    }
    switch(this.stateMachine.currentState) {
      case TurretState.INIT:
        this.animationFrame = 0;
        if (this.senseTarget()) {
          this.stateMachine.transition(TurretState.EMERGING);
        }
        break;
      case TurretState.EMERGING:
        this.animationFrame = 11 - Math.floor(((this.timer) % 1200) / 100);
        break;
      case TurretState.ACTIVE:
        if (this.senseTarget()) {
          this.stateMachine.transition(TurretState.AIMING);
        }
        break;
      case TurretState.AIMING:
        if (!this.senseTarget()) {
          this.stateMachine.transition(TurretState.ACTIVE);
        }
        break;
      case TurretState.FIRING:
        this.fireProjectile();
        if (this.burstCounter > 0) {
          this.stateMachine.transition(TurretState.BURST_COOLDOWN);
        } else {
          this.stateMachine.transition(TurretState.COOLDOWN);
        }
        break;
      case TurretState.BURST_COOLDOWN:
        break;
      case TurretState.COOLDOWN:
        break;
    }
  }

  draw(ctx:CanvasRenderingContext2D) {
    Turret.ceilingSpritesheet.draw(ctx, this.x, this.y, this.animationFrame, 0 );
  }

  startCountdown(time: number, callback: () => void) {
    this.timerCallback = callback;
    this.timer = time;
  }

  clearCountdown() {
    this.timerCallback = () => {};
    this.timer = 0;
  }

  senseTarget() {
    return this.game.player.y > this.y; // Make this a proper hitbox
  }

  fireProjectile() {
    this.burstCounter --;
    console.log("boum"); // Boum
  }

  populateStateMachine() {
    this.stateMachine.addTransition(TurretState.INIT, TurretState.EMERGING, // sense player
      () => { this.startCountdown(EMERGE_TIME, () => this.stateMachine.transition(TurretState.ACTIVE)) });

    this.stateMachine.addTransition(TurretState.EMERGING, TurretState.ACTIVE, // finish emerging
      () => { this.clearCountdown() });

    this.stateMachine.addTransition(TurretState.ACTIVE, TurretState.AIMING,
      () => { this.startCountdown(AIM_TIME, () => this.stateMachine.transition(TurretState.FIRING)) }); // sense player

    this.stateMachine.addTransition(TurretState.AIMING, TurretState.ACTIVE, // lose player
      () => { this.clearCountdown() });

    this.stateMachine.addTransition(TurretState.AIMING, TurretState.FIRING, // finish aiming
      () => { this.burstCounter = 3; });

    this.stateMachine.addTransition(TurretState.FIRING, TurretState.BURST_COOLDOWN,
      () => { this.startCountdown(BURST_COOLDOWN_TIME, () => this.stateMachine.transition(TurretState.FIRING)) }); // fire one shot

    this.stateMachine.addTransition(TurretState.BURST_COOLDOWN, TurretState.FIRING, // cooldown from that one shot
      () => { });

    this.stateMachine.addTransition(TurretState.FIRING, TurretState.COOLDOWN,
      () => { this.startCountdown(COOLDOWN_TIME, () => this.stateMachine.transition(TurretState.ACTIVE)) }); // finish firing

    this.stateMachine.addTransition(TurretState.COOLDOWN, TurretState.ACTIVE,
      () => { this.clearCountdown() }); // finish cooldown
  }
}

enum TurretState {
  INIT,
  EMERGING,
  ACTIVE,
  AIMING,
  FIRING,
  BURST_COOLDOWN,
  COOLDOWN,
}