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

    const lastx = this.x + 0;
    const lasty = this.y + 0

    this.x += (this.velocity.x * dt * 0.1);

    this.velocity.y += GRAVITY;

    /*const tileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(this.position)!;
    const tileIndexRightBelow = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(0, 1)))!;
    const terrain = this.game.gameMap?.terrainLayer.data[tileIndex]! - this.game.gameMap?.tileSets[0].firstgid!;
    const terrainRightBelow = this.game.gameMap?.terrainLayer.data[tileIndexRightBelow]! - this.game.gameMap?.tileSets[0].firstgid!;

    
    const howFarIntoTileY = this.y % TILE_SIZE;*/
    const howFarIntoTileX = this.x % TILE_SIZE;

    if (this.isOnGround) {
      this.velocity.y = 0; // When you are on the ground, gravity stops affecting you. We all know this.

      const tileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(this.position)!;
      const terrain = this.game.gameMap?.terrainLayer.data[tileIndex]! - this.game.gameMap?.tileSets[0].firstgid!;
      if (terrain === -1) {
        // I have not run into anything
        // But what does the ground beneath my feet look like?
        const tileIndexRightBelow = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(0, 2)))!; // Big look, might need to be bigger
        const terrainRightBelow = this.game.gameMap?.terrainLayer.data[tileIndexRightBelow]! - this.game.gameMap?.tileSets[0].firstgid!;
        if (terrainRightBelow === -1) {
          // We have fallen off of the ground
          this.isOnGround = false;
        } else {
          // Check if I'm running onto a slope
          const terrainProps = this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === terrainRightBelow)?.properties;
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
        const terrainProps = this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === terrain)?.properties;
        if (terrainProps) {
          // I am on a slope
          const howFarIntoTileY = this.y % TILE_SIZE;
          const props = terrainProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
          const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
          this.y -= (howFarIntoTileY - slopeHeight);
        } else {
          // I seem to have entered a solid block feet-first, while on solid ground. This shouldn't happen?
          // Unless maybe you are moving between tiles, going up a slope?
          const tileIndexRightAbove = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(0, -1)))!;
          const terrainRightAbove = this.game.gameMap?.terrainLayer.data[tileIndexRightAbove]! - this.game.gameMap?.tileSets[0].firstgid!;
          if (terrainRightAbove === -1) {
            // just pop up
            this.y -= 1;
          } else {
            const terrainRightAboveProps = this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === terrainRightAbove)?.properties;
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
      const tileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(this.position)!;
      const terrain = this.game.gameMap?.terrainLayer.data[tileIndex]! - this.game.gameMap?.tileSets[0].firstgid!;
      // My feet are inside this terrain: it can be either empty space, solid, or a slope
      if (terrain === -1) {
        // empty space, I should continue falling
      } else {
        const terrainProps = this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === terrain)?.properties;
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

    /*
    if (terrainRightBelow > -1) {
      // there is a floor below our feet
      if (terrain > -1) {
        const terrainProps = this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === terrain)?.properties;
        //console.log(terrain, this.y);
        if (terrainProps) {
          const props = terrainProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
          // we are on a slope!
          const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
          //if (slopeHeight < howFarIntoTileY) {
            this.y -= (howFarIntoTileY - slopeHeight);
            this.velocity.y = 0;
          //} else {
          //  this.y += (this.velocity.y * dt);
          //}

        } else {
          // we are in a wall!
          this.velocity.y = 0;
          const rightTileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(TILE_SIZE, 0)))!;
          const rightTerrain = this.game.gameMap?.terrainLayer.data[rightTileIndex]!;
  
          const leftTileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(-TILE_SIZE, 0)))!;
          const leftTerrain = this.game.gameMap?.terrainLayer.data[leftTileIndex]!;
  
          const upTileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(0, -TILE_SIZE)))!;
          const upTerrain = this.game.gameMap?.terrainLayer.data[upTileIndex]!;
  
          if (leftTerrain > 0 && rightTerrain > 0) {
            // we are in the floor
            // is there a slope above us
            const upTerrainProps = this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === upTerrain)?.properties;
            if (upTerrainProps) {
              // a slope is directly above us
              this.y -= 1
            }
            
            this.y -= howFarIntoTileY;
          } else {
            // we are in a floor corner of some kind. Heuristic time?
          }
          
        }
        
      } else {
        // We are directly over a floor or a slope, our square is empty
        const terrainRightBelowProps = this.game.gameMap?.tileSets[0].tileSetData.tiles.find(t => t.id === terrainRightBelow)?.properties;
        if (terrainRightBelowProps) {
          //const props = terrainRightBelowProps.reduce((acc, p) => { acc[p.name] = p.value; return acc;}, {} as {[key in string]: number})
          // we are above a slope!
          this.y += (this.velocity.y * dt);
          /*const slopeHeight = lerp(props.slopeLeft, props.slopeRight, howFarIntoTileX / TILE_SIZE);
          console.log(props.slopeLeft, props.slopeRight, howFarIntoTileX / 16, slopeHeight)
          if (slopeHeight < howFarIntoTileY) {
            this.y -= (howFarIntoTileY - slopeHeight);
            this.velocity.y = 0;
          }
        } else {
          // we are above a floor
          // TODO snap to correct height
          const remainder = this.y % 16;
          if (remainder >= 15) {
            this.y = Math.floor(this.y);
          } else {
            //this.y = (TILE_SIZE * Math.floor(this.y / TILE_SIZE)) - 1;
          }
          
          //console.log(this.y)
        }
        
      }
      
      
      
    } else {
      this.y += (this.velocity.y * dt);
    }*/
    /*if (terrain! === 0 && terrainRightBelow! > 0) {
      console.log('not bonk')
      // we are on the ground
    } else if (terrainRightBelow! === 0) {
      // we should be falling
      this.y += (GRAVITY * dt);
      //console.log('woosh', tileIndex, tileIndexRightBelow, this.position.y)
    } else {
      console.log(this.game.gameMap?.tileSets[0].tileSetData.tiles[terrain].properties)
      //we are in a wall
      //console.log('bonk', tileIndex, tileIndexRightBelow, this.position.y)
      this.y = Math.floor(this.y);
    }*/
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.isOnGround ? 'red' : 'yellow';
    ctx.fillRect(this.x + HITBOX_OFFSET.x, this.y + HITBOX_OFFSET.y, 16, 48);
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y, 1, 1);
  }
}