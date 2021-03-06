import AABBHitbox from "./AABBHitbox.js";
import Entity from "./Entity.js";
import Game from "./Game.js";
import { loadSpritesheetFrom } from "./load.js";
import { Vector2 } from "./math.js";
import Spritesheet from "./Spritesheet.js";
import StateMachine from "./StateMachine.js";

const EMERGE_TIME = 1200;
const AIM_TIME = 600;
const BURST_COOLDOWN_TIME = 400;
const COOLDOWN_TIME = 3000;
const SHUTDOWN_TIME = 4000;

export default class Turret extends Entity {
  @loadSpritesheetFrom('assets/images/ceiling-turret.png', 32, 32)
  static ceilingSpritesheet: Spritesheet;

  bulletOffset = new Vector2(12, 12);

  timer = 0;
  timerCallback = () => {};

  burstCounter = 3;
  targetLocation: Vector2 | null = null;

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
        this.animationFrame = 11 - Math.floor(((this.timer) % EMERGE_TIME) / 100);
        break;
      case TurretState.RETRACTING:
        this.animationFrame = Math.floor(((this.timer) % EMERGE_TIME) / 100);
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
    if (this.game.player.y > this.y) {
      return this.targetLocation = this.game.player.hitbox.center;
    }
    return null;
  }

  fireProjectile() {
    if (!this.targetLocation) {
      console.error('Turret\'s broke');
      debugger;
      return;
    } 
    this.burstCounter --;
    const bulletOrigin = Vector2.sumOf(this.position, this.bulletOffset)
    const directionToTarget = new Vector2(this.targetLocation.x - bulletOrigin.x, this.targetLocation.y - bulletOrigin.y).normalize();
    new TurretBullet(this.game, bulletOrigin, directionToTarget.times(0.1));
  }

  populateStateMachine() {
    this.stateMachine.addTransition(TurretState.INIT, TurretState.EMERGING, // sense player
      () => { this.startCountdown(EMERGE_TIME, () => this.stateMachine.transition(TurretState.ACTIVE)) });

    this.stateMachine.addTransition(TurretState.EMERGING, TurretState.ACTIVE, // finish emerging
      () => { this.startCountdown(SHUTDOWN_TIME, () => this.stateMachine.transition(TurretState.RETRACTING)) });

    this.stateMachine.addTransition(TurretState.ACTIVE, TurretState.AIMING,
      () => { this.startCountdown(AIM_TIME, () => this.stateMachine.transition(TurretState.FIRING)) }); // sense player

    this.stateMachine.addTransition(TurretState.AIMING, TurretState.ACTIVE, // lose player
      () => { this.startCountdown(SHUTDOWN_TIME, () => this.stateMachine.transition(TurretState.RETRACTING)) });

    this.stateMachine.addTransition(TurretState.AIMING, TurretState.FIRING, // finish aiming
      () => { this.burstCounter = 3; });

    this.stateMachine.addTransition(TurretState.FIRING, TurretState.BURST_COOLDOWN,
      () => { this.startCountdown(BURST_COOLDOWN_TIME, () => this.stateMachine.transition(TurretState.FIRING)) }); // fire one shot

    this.stateMachine.addTransition(TurretState.BURST_COOLDOWN, TurretState.FIRING, () => { });// cooldown from that one shot

    this.stateMachine.addTransition(TurretState.FIRING, TurretState.COOLDOWN,
      () => { this.startCountdown(COOLDOWN_TIME, () => this.stateMachine.transition(TurretState.ACTIVE)) }); // finish firing

    this.stateMachine.addTransition(TurretState.COOLDOWN, TurretState.ACTIVE, // finish cooldown
      () => { this.startCountdown(SHUTDOWN_TIME, () => this.stateMachine.transition(TurretState.RETRACTING)) });

    this.stateMachine.addTransition(TurretState.ACTIVE, TurretState.RETRACTING, // finish cooldown
      () => { this.startCountdown(EMERGE_TIME, () => this.stateMachine.transition(TurretState.INIT)) });

    this.stateMachine.addTransition(TurretState.RETRACTING, TurretState.INIT, // finish cooldown
      () => { this.clearCountdown() });
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
  RETRACTING,
}

class TurretBullet extends Entity {
  @loadSpritesheetFrom('assets/images/turret-bullet.png', 8, 8)
  static spritesheet: Spritesheet;

  hitbox = new AABBHitbox(new Vector2(1, 1), new Vector2(7, 7));
  timer = 6000;
  constructor(game: Game, position: Vector2, readonly velocity: Vector2) {
    super(game, position);
  }
  
  tick(dt: number) {
    this.timer -= dt;
    if (this.timer < 0) this.destroy();
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.hitbox.offset = this.position;
    if (this.game.gameMap.collides(this.hitbox)) {
      this.destroy();
    };
    if (!this.game.player.isInvincible && this.hitbox.collides(this.game.player.hitbox)) {
      this.game.player.damage(1);
      this.destroy();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    TurretBullet.spritesheet.draw(ctx, this.position.x, this.position.y, Math.floor((this.timer / 100) % 4), 0);
  }
}