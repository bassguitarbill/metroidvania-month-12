import AABBHitbox from "./AABBHitbox.js";
import Entity from "./Entity.js";
import { TILE_SIZE } from "./Game.js";
import { Controls, isControlPressed } from "./Input.js";
import { loadSpritesheetFrom } from "./load.js";
import { lerp, Vector2 } from "./math.js";
import Spritesheet from "./Spritesheet.js";

const GRAVITY = .003;

const HITBOX_OFFSET = new Vector2(-8, -42);
const HITBOX_SIZE = new Vector2(16, 44);

const CROUCHING_HITBOX_OFFSET = new Vector2(-8, -27);
const CROUCHING_HITBOX_SIZE = new Vector2(16, 29);

const SPRITE_OFFSET = new Vector2(-23, -46);
const SPRITE_SIZE = new Vector2(46, 50);

const RUN_ACCELERATION = 0.004;
const MAX_RUN_SPEED = 1.5;
const RUN_DECELERATION = 0.008;

const JUMP_HELD_GRAVITY_SCALE = 1;
const JUMP_RELEASED_GRAVITY_SCALE = 2.5;

export default class Player extends Entity {

  @loadSpritesheetFrom('assets/images/bio-guy.png', SPRITE_SIZE.x, SPRITE_SIZE.y)
  static spritesheetRight: Spritesheet;
  @loadSpritesheetFrom('assets/images/bio-guy-reversed.png', SPRITE_SIZE.x, SPRITE_SIZE.y)
  static spritesheetLeft: Spritesheet;

  velocity = new Vector2();
  isOnGround = false;
  isOnSlope = false;
  gravityScale = JUMP_HELD_GRAVITY_SCALE;

  isCrouching = false;

  standingHitbox = new AABBHitbox(HITBOX_OFFSET.clone(), Vector2.sumOf(HITBOX_OFFSET, HITBOX_SIZE));
  crouchingHitbox = new AABBHitbox(CROUCHING_HITBOX_OFFSET.clone(), Vector2.sumOf(CROUCHING_HITBOX_OFFSET, CROUCHING_HITBOX_SIZE));
  get hitbox() {
    return this.isCrouching ? this.crouchingHitbox : this.standingHitbox;
  }

  lastFacingDirection = 1;

  animationTimer = 0;

  isKnockback = false;
  knockbackCooldown = 0;

  isInvincible = false;
  invincibilityCooldown = 0;
  invincibilityFlashing = false;

  currentZone: number = 0;

  tick(dt: number) {
    this.animationTimer += dt;
    this.hitbox.offset = this.position;
    this.currentZone = this.game.gameMap.getZone(this.position)?.zoneNumber || 0;

    this.knockbackCooldown -= dt;
    if (this.knockbackCooldown < 0) this.isKnockback = false;

    this.invincibilityCooldown -= dt;
    if (this.invincibilityCooldown < 0) this.isInvincible = false;
    this.invincibilityFlashing = !this.invincibilityFlashing;

    if (!this.isKnockback) this.checkControls(dt);

    this.x += (this.velocity.x * dt * 0.1);
    this.velocity.y += (GRAVITY * this.gravityScale);

    const howFarIntoTileX = this.x % TILE_SIZE;

    this.checkLateralCollisions();

    if (this.isOnGround) {
      this.gravityScale = JUMP_HELD_GRAVITY_SCALE;
      this.velocity.y = 0; // When you are on the ground, gravity stops affecting you. We all know this.
      this.isOnSlope = false; // We will set this appropriately, later.

      const terrain = this.getTerrain();
      if (terrain === -1) {
        // I have not run into anything
        // But what does the ground beneath my feet look like?
        const terrainRightBelow = this.getTerrain(new Vector2(0, 8)); // Big look, might need to be bigger
        if (terrainRightBelow === -1) {
          // We have fallen off of the ground
          this.isOnGround = false;
        } else {
          // Check if I'm running onto a slope
          const props = this.getPropertiesFromTerrain(new Vector2(0, 8));
          const howFarIntoTileY = this.y % TILE_SIZE;
          if (props) {
            // I am above a slope
            const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
            this.y -= (howFarIntoTileY - slopeHeight - TILE_SIZE);
            this.isOnSlope = true;
          } else {
            // Solid ground beneath my feet, all is good
            // Maybe we should actually be *on* the ground rather than hovering above it
            this.y += 15 - howFarIntoTileY;
          }
        }

      } else {
        const props = this.getPropertiesFromTerrain();
        const howFarIntoTileY = this.y % TILE_SIZE;
        if (props) {
          // I am on a slope
          const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
          this.y -= (howFarIntoTileY - slopeHeight);
          this.isOnSlope = true;
        } else {
          // I seem to have entered a solid block feet-first, while on solid ground. This shouldn't happen?
          // Unless maybe you are moving between tiles, going up a slope?
          const terrainRightAbove = this.getTerrain(new Vector2(0, -3));
          if (terrainRightAbove === -1) {
            // just pop up
            this.y -= howFarIntoTileY + 1;
          } else {
            const props = this.getPropertiesFromTerrain(new Vector2(0, -3));
            if (props) {
              // Yep okay we have entered a slope from below
              const howFarIntoTileY = this.y % TILE_SIZE;
              const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
              this.y -= (TILE_SIZE + howFarIntoTileY - slopeHeight);
              this.isOnSlope = true;
            
            } else {
              console.error('Why are you in a solid block?', this.x, this.y);
              if ((window as any).debug) debugger;
            }
          }
        }
      }

    } else {
      // I am in freefall
      this.isOnGround = false;
      this.isOnSlope = false;
      this.y += (this.velocity.y * dt);

      // Let's check if we're moving up and have bonked our head
      if (this.velocity.y < 0) {
        const headTerrain = this.getTerrain(new Vector2(0, HITBOX_OFFSET.y));
        if (headTerrain === -1) {
          // no thoughts, head empty
        } else {
          // I have bonked my head
          const howFarIntoTileY = TILE_SIZE - (this.y % TILE_SIZE);
          this.y += howFarIntoTileY;
          this.velocity.y = 0;
        }
      }

      const terrain = this.getTerrain();
      // My feet are inside this terrain: it can be either empty space, solid, or a slope
      if (terrain === -1) {
        // empty space, I should continue falling
      } else {
        const props = this.getPropertiesFromTerrain();
        if (props) {
          // I have landed on a slope
          // Am I above the slope or actually inside it?
          const howFarIntoTileY = this.y % TILE_SIZE;
          const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
          if (slopeHeight > howFarIntoTileY) {
            // Still above it
          } else {
            // I've landed
            this.y -= (howFarIntoTileY - slopeHeight);
            this.isOnGround = true;
            this.isOnSlope = true;
          }
        } else {
          // I have landed inside a solid block
          // Need to rise out of it
          this.position.y -= ((this.y % TILE_SIZE) + 1); // +1 to put my feet above the ground, not still in it
          this.position.y = Math.floor(this.position.y);
          this.isOnGround = true;
        }
      }
    }
  }

  checkControls(dt: number) {
    if (isControlPressed(Controls.DOWN) && this.isOnGround) {
      this.isCrouching = true;
      this.velocity.x = 0;
      return;
    }
    this.isCrouching = false;

    let xVelocity = this.velocity.x + 0;
    if (isControlPressed(Controls.RIGHT)) {
      xVelocity += (RUN_ACCELERATION * dt);
      if (Math.sign(this.velocity.x) === -1) {
        // pushing right while moving left
        xVelocity += (RUN_DECELERATION * dt);
      }
    } else if (isControlPressed(Controls.LEFT)) {
      xVelocity -= (RUN_ACCELERATION * dt);
      if (Math.sign(this.velocity.x) === 1) {
        // pushing left while moving right
        xVelocity -= (RUN_DECELERATION * dt);
      }
    } else {
      xVelocity -= (Math.sign(xVelocity) * RUN_DECELERATION * dt);
    }

    xVelocity = Math.min(Math.max(xVelocity, -MAX_RUN_SPEED), MAX_RUN_SPEED);
    if (Math.sign(xVelocity) * -1 === Math.sign(this.velocity.x)) xVelocity = 0; // Deceleration should not push you backwards
    this.velocity.x = xVelocity;

    if (this.velocity.x !== 0) {
      this.lastFacingDirection = this.velocity.x > 0 ? 0 : 1;
    }

    if (isControlPressed(Controls.UP)) {
      if (this.isOnGround) {
        this.isOnGround = false;
        this.velocity.y = -.21;
      } 
    } else {
      this.gravityScale = JUMP_RELEASED_GRAVITY_SCALE;
    }
  }

  checkLateralCollisions() {
    const horizOffset = HITBOX_OFFSET.x + HITBOX_SIZE.x;
    // Check first for side-to-side collisions
    // If I am on a slope, I don't need to worry about anything at ground level, to the right of me, because I'll go over it
    if (!this.isOnSlope) {
      // Check the bottom right corner of the hitbox
      const rightTerrain = this.getTerrain(new Vector2(horizOffset, 0));
      if (rightTerrain !== -1) {
        const props = this.getPropertiesFromTerrain(new Vector2(horizOffset, 0));
        if (props) {
          // Running onto a slope
        } else {
          // Colliding
          const howFarIntoTileX = (this.x + horizOffset) % TILE_SIZE;
          this.x -= howFarIntoTileX;
          this.velocity.x = 0;
        }
      }
      // Check the bottom left corner of the hitbox
      const leftTerrain = this.getTerrain(new Vector2(HITBOX_OFFSET.x, 0));
      if (leftTerrain !== -1) {
        const props = this.getPropertiesFromTerrain(new Vector2(HITBOX_OFFSET.x, 0));
        if (props) {
          // Running onto a slope
        } else {
          // Colliding
          const howFarIntoTileX = TILE_SIZE - (this.x + HITBOX_OFFSET.x) % TILE_SIZE;
          this.x += howFarIntoTileX;
          this.velocity.x = 0;
        }
      }
    }
    // okay now we need to check all the way up the hitbox, once per tile, left and right
    for (let y=0; y < HITBOX_SIZE.y; y += TILE_SIZE) {
      const rightTerrain = this.getTerrain(new Vector2(horizOffset, HITBOX_OFFSET.y + y));
      if (rightTerrain !== -1) {
        const props = this.getPropertiesFromTerrain(new Vector2(horizOffset, HITBOX_OFFSET.y + y));
        if(!props) {
          const howFarIntoTileX = (this.x + horizOffset) % TILE_SIZE;
          this.x -= howFarIntoTileX;
          this.velocity.x = 0;
        }
      }
      const leftTerrain = this.getTerrain(new Vector2(HITBOX_OFFSET.x, HITBOX_OFFSET.y + y));
      if (leftTerrain !== -1) {
        const props = this.getPropertiesFromTerrain(new Vector2(HITBOX_OFFSET.x, HITBOX_OFFSET.y + y));
        if(!props) {
          const howFarIntoTileX = TILE_SIZE - (this.x + HITBOX_OFFSET.x) % TILE_SIZE;
          this.x += howFarIntoTileX;
          this.velocity.x = 0;
        }
      }
    }
    
  }

  getTerrain(offset = new Vector2()) {
    const tileIndex = this.game.gameMap.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, offset))!;
    const offsetTerrain = this.game.gameMap.terrainLayer.data[tileIndex]!;
    const gameMap = this.game.gameMap;
    const tileSet = gameMap.getTilesetFromIndexAndLayer(offsetTerrain);
    return offsetTerrain === 0 ? -1 : offsetTerrain - tileSet.firstgid;
  }

  getPropertiesFromTerrain(offset = new Vector2()) {
    const tileIndex = this.game.gameMap.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, offset))!;
    const offsetTerrain = this.game.gameMap.terrainLayer.data[tileIndex]!;
    //if (tileIndex === 0) return;
    const gameMap = this.game.gameMap;
    const tileSet = gameMap.getTilesetFromIndexAndLayer(offsetTerrain);
    const listedProps = tileSet.tileSetData.tiles.find(t => t.id === offsetTerrain - tileSet.firstgid)?.properties;
    if (!listedProps) return undefined;
    return listedProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.hitbox.draw(ctx);
    if (this.isInvincible && this.invincibilityFlashing) return;
    const spriteCoordinates = this.chooseSprite();
    const spritesheet = this.lastFacingDirection ? Player.spritesheetLeft : Player.spritesheetRight;
    spritesheet.draw(ctx, this.x + SPRITE_OFFSET.x, this.y + SPRITE_OFFSET.y, spriteCoordinates.x, spriteCoordinates.y);
  }

  chooseSprite(): Vector2 {
    if (this.isOnGround) { // I am on the ground
      if (this.isCrouching) {
        return new Vector2(1, 0); // I am crouching
      }
      if (Math.abs(this.velocity.x) > 0.02) { // I am running
        return new Vector2(Math.floor(this.animationTimer / 100 % 8), 3); // Running animation
      } else {
        return new Vector2(0, 0); // Idle
      }
    } else { // I am airborne
      if (this.isKnockback) { // I am being knocked back
        return new Vector2(0, 1);
      }
      if (this.velocity.y > 0) {
        return new Vector2(7, 0); // I am falling
      } else {
        return new Vector2(6, 0); // I am rising
      }
    }
  }

  damage(_amount: number) {
    this.velocity = new Vector2((this.lastFacingDirection - 0.5) * 2, -0.05);
    this.isOnGround = false;
    this.isOnSlope = false;
    this.isKnockback = true;
    this.knockbackCooldown = 500;
    this.isInvincible = true;
    this.invincibilityCooldown = 2000;
  }
}