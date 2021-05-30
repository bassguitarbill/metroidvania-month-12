import TileSet from "./TileSet.js";
import { loadJson } from "./load.js";
import { Vector2 } from "./math.js";
import Game from "./Game.js";
import AABBHitbox from "./AABBHitbox.js";

const OOB_COLOR = "#160712";

export default class GameMap {
  animationTimer = 0;
  terrainLayer: MapDataLayer;
  terrainLayerImage: HTMLImageElement;
  eventLayer: MapDataLayer;
  zoneLayer: MapDataLayer;
  zoneCollection: ZoneCollection;
  
  constructor(readonly mapData: TileMapData, readonly tileSets: Array<TileSet>) {
    const terrainLayer = this.mapData.layers.find(l => l.name === 'terrain');
    if (!terrainLayer) throw 'No terrain layer in map data';
    this.terrainLayer = terrainLayer;
    this.terrainLayerImage = this.drawLayerImage(terrainLayer);

    const eventLayer = this.mapData.layers.find(l => l.name === 'events');
    if (!eventLayer) throw 'No event layer in map data';
    this.eventLayer = eventLayer;

    const zoneLayer = this.mapData.layers.find(l => l.name === 'zones');
    if (!zoneLayer) throw 'No terrain layer in map data';
    this.zoneLayer = zoneLayer;
    this.zoneCollection = new ZoneCollection(this);
  }
  
  static async loadInstance(mapFilePath: string): Promise<GameMap> {
    const mapData: TileMapData = await loadJson(mapFilePath);
    const tileSets: Array<TileSet> = [];
    await Promise.all(mapData.tilesets.map(async (ts, index) => {
      const tileSet = await TileSet.load(ts.source, ts.firstgid);
      tileSets[index] = tileSet;
    }));
    
    return new GameMap(mapData, tileSets);
  }

  tick(dt: number) {
    this.animationTimer += dt;
  }

  draw(ctx: CanvasRenderingContext2D, game: Game) {
    if(!this.mapData) return;
    this.drawTerrainLayer(ctx, game);
  }

  drawTerrainLayer(ctx: CanvasRenderingContext2D, game: Game) {
    const currentZone = this.getZone(game.player.position);
    if (currentZone) {
      currentZone.draw(ctx, this.terrainLayerImage);
      
      const mapWidth = this.mapData.width * this.mapData.tilewidth;
      const mapHeight = this.mapData.height * this.mapData.tileheight;

      ctx.fillStyle = OOB_COLOR;

      ctx.beginPath();
      ctx.rect(-mapWidth, -mapHeight, 3 * mapWidth, 3 * mapHeight)
      if (currentZone.polygonalAreas.length) {
        currentZone.polygonalAreas.forEach(a => {
          ctx.lineTo(a.polygon[0].x + a.x, a.polygon[0].y + a.y);
          for (let i=a.polygon.length - 1; i >= 0; i--) { // Path this polygon backwards so it is NOT masked
            const pt = a.polygon[i];
            ctx.lineTo(pt.x + a.x, pt.y + a.y);
          }
        });
      } else {
        ctx.rect(currentZone.x + 1, currentZone.y + currentZone.height - 1, currentZone.width - 2, -currentZone.height + 2) // Path this rectangle upside-down so it is NOT masked
      }
     
      ctx.fill();
    } else {
      // If you're outside the map, you probably won't be able to get back in, but at least this will make for a funny screenshot
      ctx.drawImage(this.terrainLayerImage, 0, 0, this.mapData.width, this.mapData.height);
    }
  }

  getTileIndex(x: number, y: number) {
    return (this.terrainLayer.width * y) + x;
  }

  getTileIndexFromGameMapPosition(position: Vector2) {
    return this.getTileIndex(Math.floor(position.x / this.mapData.tilewidth), Math.floor(position.y / this.mapData.tileheight));
  }

  getZone(position: Vector2): Zone | undefined {
    return this.zoneCollection.zones.find(zone => {
      return zone.rectangularAreas.find(a => {
        return position.x > a.x && position.x < (a.x + a.width) && position.y > a.y && position.y < (a.y + a.height);
      });
    })
  }

  getTilesetFromIndexAndLayer(index: number) {
    return this.tileSets.reduce((acc, ts) => {
      if (ts.firstgid <= index && ts.firstgid > acc.firstgid) {
        return ts;
      }
      return acc;
    });
  }

  drawLayerImage(layer: MapDataLayer): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.mapData.width * this.mapData.tilewidth;
    canvas.height = this.mapData.height * this.mapData.tileheight;
    const ctx = canvas.getContext('2d')!;
    
    const { tilewidth, tileheight } = this.mapData;
    for (let x=0; x < layer.width; x++) {
      for (let y=0; y < layer.height; y++) {
        const tileIndex = layer.data[(layer.width * y) + x];
        if (tileIndex === 0) continue; // Empty tile
        const tileset = this.getTilesetFromIndexAndLayer(tileIndex);
        let tileFromSet = tileIndex - tileset.firstgid;
        
        const tileImageX = (tileFromSet % tileset.tileSetData.columns) * tilewidth;
        const tileImageY = Math.floor(tileFromSet / tileset.tileSetData.columns) * tileheight;
        ctx.drawImage(tileset.image, tileImageX, tileImageY, tilewidth, tileheight,
          x * tilewidth, y * tileheight, tilewidth, tileheight);
      }
    }  
    const image = new Image();
    image.src = canvas.toDataURL();
    return image;
  }

  collides(hitbox: AABBHitbox): boolean {
    for (let x = hitbox.topLeft.x; x < hitbox.bottomRight.x; x += this.mapData.tilewidth) {
      for (let y = hitbox.topLeft.y; y < hitbox.bottomRight.y; y += this.mapData.tileheight) {
        const tileIndex = this.getTileIndexFromGameMapPosition(new Vector2(x, y));
        const tile = this.terrainLayer.data[tileIndex];
        if (tile > 0) return true;
      }
    }
    if ( this.terrainLayer.data[this.getTileIndexFromGameMapPosition(new Vector2(hitbox.bottomRight.x, hitbox.topLeft.y))] > 0) return true;
    if ( this.terrainLayer.data[this.getTileIndexFromGameMapPosition(new Vector2(hitbox.topLeft.x, hitbox.bottomRight.y))] > 0) return true;
    if ( this.terrainLayer.data[this.getTileIndexFromGameMapPosition(new Vector2(hitbox.bottomRight.x, hitbox.bottomRight.y))] > 0) return true;
    return false;
  }
}

class ZoneCollection {
  zones: Array<Zone> = [];
  constructor(readonly gameMap: GameMap) {
    gameMap.zoneLayer.objects.forEach(this.addArea.bind(this));
  }
  addArea(area: ObjectData) {
    const zoneNumber = area.properties.find(p => p.name === 'zone')?.value as number;
    if (zoneNumber === undefined) {
      console.error('Unable to add area to ZoneCollection: no \'zone\' property detected');
      return;
    }
    let zone = this.zones.find(z => z.zoneNumber === zoneNumber);
    if (!zone) {
      zone = new Zone(this.gameMap, zoneNumber);
      this.zones.push(zone);
    }

    if (area.polygon) {
      zone.polygonalAreas.push(area);
    } else {
      zone.rectangularAreas.push(area);
    }
    
  }

  getZone(zoneNumber: number) {
    return this.zones.find(z => z.zoneNumber === zoneNumber);
  }
}

class Zone {
  rectangularAreas: Array<ObjectData> = [];
  polygonalAreas: Array<ObjectData> = [];
  constructor(readonly gameMap: GameMap, readonly zoneNumber: number) {};

  get x() {
    return this.rectangularAreas.reduce((a1, a2) => a1.x > a2.x ? a2 : a1).x;
  }

  get y() {
    return this.rectangularAreas.reduce((a1, a2) => a1.y > a2.y ? a2 : a1).y;
  }
  get xMax() {
    const farthestRightArea = this.rectangularAreas.reduce((a1, a2) => (a1.x + a1.width) < (a2.x + a2.width) ? a2 : a1);
    return farthestRightArea.x + farthestRightArea.width;
  }

  get yMax() {
    const lowestArea = this.rectangularAreas.reduce((a1, a2) => (a1.y + a1.height) < (a2.y + a2.height) ? a2 : a1);
    return lowestArea.y + lowestArea.height;
  }

  get width() {
    return this.xMax - this.x;
  }

  get height() {
    return this.yMax - this.y;
  }

  draw(ctx: CanvasRenderingContext2D, terrainImage: HTMLImageElement) {
    this.rectangularAreas.forEach(a => {
      ctx.drawImage(terrainImage, a.x, a.y, a.width, a.height, a.x, a.y, a.width, a.height)
    })
  }

  getSpawners() {
    return this.gameMap.eventLayer.objects.filter(o => o.type === 'spawner' && this.rectangularAreas.find(a => (o.x > a.x) && (o.x < (a.x + a.width)) && (o.y > a.y) && (o.y < (a.y + a.height))));
  }
}

interface TileMapData {
  compressionlevel: number,
  editorsettings: any,
  height: number,
  infinite: boolean,
  layers: Array<MapDataLayer>,
  nextlayerid: number,
  nextobjectid: number,
  orientation: string,
  renderorder: string,
  tiledversion: string,
  tileheight: number,
  tilesets: Array<TileSetReference>,
  tilewidth: number,
  type: string,
  version: number,
  width: number,
}

interface TileSetReference {
  firstgid: number,
  source: string
}

interface MapDataLayer {
  data: Array<number>,
  height: number,
  id: number,
  name: string,
  objects: Array<ObjectData>,
  opacity: number,
  type: string,
  visible: boolean,
  width: number,
  x: number,
  y: number
}

interface ObjectData {
  gid: number,
  height: number,
  id: number,
  name: string,
  point: boolean,
  polygon: Array<{x: number, y:number}>,
  properties:[
        {
          name: string,
          type: string,
          value: number | string,
        }],
  rotation: number,
  type: string,
  visible: boolean,
  width: number,
  x: number,
  y: number,
}

export { MapDataLayer, ObjectData };