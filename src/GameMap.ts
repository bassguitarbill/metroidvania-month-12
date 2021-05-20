import TileSet from "./TileSet.js";
import { loadJson } from "./load.js";
import { Vector2 } from "./math.js";
import Game from "./Game.js";

export default class GameMap {
  animationTimer = 0;
  waterLevel = 0;
  darknessLevel = 0;
  maxDarknessLevel = 0;
  terrainLayer: MapDataLayer;
  zoneLayer: MapDataLayer;

  colliderData: Array<Array<number>> = [];
  checkingTheseTiles: Array<number> = [];

  constructor(readonly mapData: TileMapData, readonly tileSets: Array<TileSet>) {
    const terrainLayer = this.mapData.layers.find(l => l.name === 'terrain');
    if (!terrainLayer) throw 'No terrain layer in map data';
    this.terrainLayer = terrainLayer;

    const zoneLayer = this.mapData.layers.find(l => l.name === 'zones');
    if (!zoneLayer) throw 'No terrain layer in map data';
    this.zoneLayer = zoneLayer;
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
    this.drawLayer(ctx, this.terrainLayer, game);
  }

  drawLayer(ctx: CanvasRenderingContext2D, layer: MapDataLayer, game: Game) {
    //const tilesetData = tileset.tileSetData!;
    //const image = tileset.image;
    //const columns = tilesetData.columns;

    const { tilewidth, tileheight } = this.mapData;
    
    const currentZone = this.getZone(game.player.position);
    if (!currentZone) return;
    for (let x=(currentZone.x / tilewidth); x < ((currentZone.x+currentZone.width) / tilewidth); x++) {
      for (let y=(currentZone.y / tileheight); y < ((currentZone.y+currentZone.height) / tileheight); y++) {
        const tileIndex = layer.data[(layer.width * y) + x];
        if (tileIndex === 0) continue; // Empty tile
        const tileset = this.getTilesetFromIndexAndLayer(tileIndex);
        let tileFromSet = tileIndex - tileset.firstgid;

        if (tileFromSet < 0) console.error('fuck', x, y, tileIndex, tileFromSet);
        const tileImageX = (tileFromSet % tileset.tileSetData.columns) * tilewidth;
        const tileImageY = Math.floor(tileFromSet / tileset.tileSetData.columns) * tileheight;
        ctx.drawImage(tileset.image, tileImageX, tileImageY, tilewidth, tileheight,
          x * tilewidth, y * tileheight, tilewidth, tileheight);
      }
    }
  }

  getTileIndex(x: number, y: number) {
    return (this.terrainLayer.width * y) + x;
  }

  getTileIndexFromGameMapPosition(position: Vector2) {
    return this.getTileIndex(Math.floor(position.x / this.mapData.tilewidth), Math.floor(position.y / this.mapData.tileheight));
  }

  getZone(position: Vector2): ObjectData | undefined {
    return this.zoneLayer.objects.find(zone => {
      return position.x > zone.x && position.x < (zone.x + zone.width) && position.y > zone.y && position.y < (zone.y + zone.height);
    });
  }

  getTilesetFromIndexAndLayer(index: number) {
    return this.tileSets.reduce((acc, ts) => {
      if (ts.firstgid <= index && ts.firstgid > acc.firstgid) {
        return ts;
      }
      return acc;
    });
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