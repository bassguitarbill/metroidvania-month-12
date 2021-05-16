import TileSet from "./TileSet.js";
import { loadJson } from "./load.js";
import { Vector2 } from "./math.js";

export default class GameMap {
  animationTimer = 0;
  waterLevel = 0;
  darknessLevel = 0;
  maxDarknessLevel = 0;
  terrainLayer: MapDataLayer;

  colliderData: Array<Array<number>> = [];
  checkingTheseTiles: Array<number> = [];

  constructor(readonly mapData: TileMapData, readonly tileSets: Array<TileSet>) {
    const terrainLayer = this.mapData.layers.find(l => l.name === 'terrain');
    if (!terrainLayer) throw 'No terrain layer in map data';
    this.terrainLayer = terrainLayer;
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

  draw(ctx: CanvasRenderingContext2D) {
    if(!this.mapData) return;
    this.drawLayer(ctx, this.mapData.layers[0], this.tileSets[0]);
  }

  drawLayer(ctx: CanvasRenderingContext2D, layer: MapDataLayer, tileset: TileSet) {
    const tilesetData = tileset.tileSetData!;
    const image = tileset.image;
    const columns = tilesetData.columns;
    
    for (let x=0; x < layer.width; x++) {
      for (let y=0; y < layer.height; y++) {
        const tileIndex = layer.data[(layer.width * y) + x];
        if (tileIndex === 0) continue; // Empty tile
        
        let tileFromSet = tileIndex - tileset.firstgid;

        const tileImageX = (tileFromSet % columns) * tilesetData.tilewidth;
        const tileImageY = Math.floor(tileFromSet / columns) * tilesetData.tileheight;
        ctx.drawImage(image, tileImageX, tileImageY, tilesetData.tilewidth, tilesetData.tileheight,
          x * tilesetData.tilewidth, y * tilesetData.tileheight, tilesetData.tilewidth, tilesetData.tileheight);
      }
    }
  }

  getTileIndex(x: number, y: number) {
    return (this.terrainLayer.width * y) + x;
  }

  getTileIndexFromGameMapPosition(position: Vector2) {
    return this.getTileIndex(Math.floor(position.x / this.mapData.tilewidth), Math.floor(position.y / this.mapData.tileheight));
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