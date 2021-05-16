import Entity from "./Entity.js";
import { TILE_SIZE } from "./Game.js";
import { Controls, isControlPressed } from "./Input.js";
import { lerp, Vector2 } from "./math.js";

const GRAVITY = .003;
const HITBOX_OFFSET = new Vector2(-8, -47);

export default class Player extends Entity {
  velocity = new Vector2();
  tick(dt: number) {
    if (isControlPressed(Controls.RIGHT)) {
      this.velocity.x = 1.0;
    } else if (isControlPressed(Controls.LEFT)) {
      this.velocity.x = -1.0;
    } else {
      this.velocity.x = 0;
    }

    const lastx = this.x + 0;
    const lasty = this.y + 0

    this.x += (this.velocity.x * dt * 0.1);

    this.velocity.y += GRAVITY;

    const tileIndex = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(0, -1)))!;
    const tileIndexRightBelow = this.game.gameMap?.getTileIndexFromGameMapPosition(Vector2.sumOf(this.position, new Vector2(0, 2)))!;
    const terrain = this.game.gameMap?.terrainLayer.data[tileIndex]! - this.game.gameMap?.tileSets[0].firstgid!;
    const terrainRightBelow = this.game.gameMap?.terrainLayer.data[tileIndexRightBelow]! - this.game.gameMap?.tileSets[0].firstgid!;

    const howFarIntoTileX = this.x % TILE_SIZE;
    const howFarIntoTileY = this.y % TILE_SIZE;

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
          }*/
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
    }
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
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x + HITBOX_OFFSET.x, this.y + HITBOX_OFFSET.y, 16, 48);
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y, 1, 1);
  }
}