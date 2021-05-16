import Entity from "./Entity.js";
import { TILE_SIZE } from "./Game.js";
import { Controls, isControlPressed } from "./Input.js";
import { lerp, Vector2 } from "./math.js";

const GRAVITY = .003;
const HITBOX_OFFSET = new Vector2(-8, -47);

export default class Player extends Entity {
  velocity = new Vector2();
  isOnGround = false;

  tick(dt: number) {
    if (isControlPressed(Controls.RIGHT)) {
      this.velocity.x = 1.0;
    } else if (isControlPressed(Controls.LEFT)) {
      this.velocity.x = -1.0;
    } else {
      this.velocity.x = 0;
    }

    if (isControlPressed(Controls.UP) && this.isOnGround) {
      this.isOnGround = false;
      this.velocity.y = -.15;
    }

    this.x += (this.velocity.x * dt * 0.1);
    this.velocity.y += GRAVITY;

    const howFarIntoTileX = this.x % TILE_SIZE;

    if (this.isOnGround) {
      this.velocity.y = 0; // When you are on the ground, gravity stops affecting you. We all know this.

      const terrain = this.getTerrain();
      if (terrain === -1) {
        // I have not run into anything
        // But what does the ground beneath my feet look like?
        const terrainRightBelow = this.getTerrain(new Vector2(0, 2)); // Big look, might need to be bigger
        if (terrainRightBelow === -1) {
          // We have fallen off of the ground
          this.isOnGround = false;
        } else {
          // Check if I'm running onto a slope
          const terrainProps = this.getPropertiesFromTerrain(terrainRightBelow);
          if (terrainProps) {
            // I am above a slope
            const howFarIntoTileY = this.y % TILE_SIZE;
            const props = terrainProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
            const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
            this.y -= (howFarIntoTileY - slopeHeight - TILE_SIZE);
          } else {
            // Solid ground beneath my feet, all is good
          }
        }

      } else {
        const terrainProps = this.getPropertiesFromTerrain(terrain);
        if (terrainProps) {
          // I am on a slope
          const howFarIntoTileY = this.y % TILE_SIZE;
          const props = terrainProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
          const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
          this.y -= (howFarIntoTileY - slopeHeight);
        } else {
          // I seem to have entered a solid block feet-first, while on solid ground. This shouldn't happen?
          // Unless maybe you are moving between tiles, going up a slope?
          const terrainRightAbove = this.getTerrain(new Vector2(0, -1));
          if (terrainRightAbove === -1) {
            // just pop up
            this.y -= 1;
          } else {
            const terrainRightAboveProps = this.getPropertiesFromTerrain(terrainRightAbove);
            if (terrainRightAboveProps) {
              // Yep okay we have entered a slope from below
              
              const howFarIntoTileY = this.y % TILE_SIZE;
              const props = terrainRightAboveProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
              const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
              this.y -= (TILE_SIZE + howFarIntoTileY - slopeHeight);
            
            } else {
              console.error('Why are you in a solid block?', terrain, terrainRightAbove);
              if ((window as any).debug) debugger;
            }
          }
        }
      }

    } else {
      // I am in freefall
      this.y += (this.velocity.y * dt);
      const terrain = this.getTerrain();
      // My feet are inside this terrain: it can be either empty space, solid, or a slope
      if (terrain === -1) {
        // empty space, I should continue falling
      } else {
        const terrainProps = this.getPropertiesFromTerrain(terrain);
        if (terrainProps) {
          // I have landed on a slope
          // Am I above the slope or actually inside it?
          const howFarIntoTileY = this.y % TILE_SIZE;
          const props = terrainProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
          const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
          if (slopeHeight > howFarIntoTileY) {
            // Still above it
          } else {
            // I've landed
            this.y -= (howFarIntoTileY - slopeHeight);
            this.isOnGround = true;
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

  getTerrain(offset = new Vector2()) {
    const tileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, offset))!;
    return this.game.gameMap?.terrainLayer.data[tileIndex]! - this.game.gameMap?.tileSets[0].firstgid!;
  }

  getPropertiesFromTerrain(tileIndex: number) {
    return this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === tileIndex)?.properties;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.isOnGround ? 'red' : 'yellow';
    ctx.fillRect(this.x + HITBOX_OFFSET.x, this.y + HITBOX_OFFSET.y, 16, 48);
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y, 1, 1);
  }
}