import { loadJson } from "./load.js";

class TileSet {
  constructor(readonly fileName: string, readonly firstgid: number, readonly tileSetData: TileSetData, readonly image: HTMLImageElement) {}
  static async load(fileName: string, firstgid: number): Promise<TileSet> {
    const tileSetData = await loadJson('assets/' + fileName)!;
    const image = new Image();
    await new Promise((res, _) => {
      image.onload = () => res(null);
      image.src = 'assets/' + tileSetData.image;
    });
    return new TileSet(fileName, firstgid, tileSetData, image);
  }
}



interface TileSetData {
  columns: number,
  image: string,
  imageheight: number,
  imagewidth: number,
  margin: number,
  name: string,
  spacing: number,
  tilecount: number,
  tiledversion: string,
  tileheight: number,
  tiles: Array<TileData>,
  tilewidth: number,
  type: string,
  version: number,
}

interface TileData {
  animation: Array<AnimationData>,
  id: number,
  properties: [{
    name: string,
    type: string,
    value: number,
  }],
}

interface AnimationData {
  duration: number,
  tileid: number,
}

export default TileSet;
export { TileSetData };