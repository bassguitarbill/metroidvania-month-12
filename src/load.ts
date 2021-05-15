import Spritesheet from "./Spritesheet.js";

async function loadJson(path: string) {
  const response = await fetch(path);
  if(!response.ok) throw new Error(`Failed to load ${path}: ${response.statusText}`);
  return await response.json();
}

function loadImageFrom(source: string): any {
  return (target: any, propertyKey: string) => {
    addAsset(new Promise<void>(res => {
      const img = new Image();
      img.src = source;
      target[propertyKey] = img;
      img.addEventListener('load', _ => res());
    }));
  }
}

function loadSpritesheetFrom(source: string, width: number, height: number): any {
  return (target: any, propertyKey: string) => {
    addAsset(new Promise<void>(async res => {
      const spritesheet = await Spritesheet.load(source, width, height);
      target[propertyKey] = spritesheet;
      res();
    }));
  }
}

function loadSoundEffectsFrom(...source: Array<string>) {
  return (target: any, propertyKey: string) => {
    target[propertyKey] = {};
    source.forEach(s => {
      addAsset(new Promise<void>(res => {
        const audioElement = new Audio();
        audioElement.src = `assets/audio/${s}`;
        target[propertyKey][s] = audioElement;
        res();
      }))
    })
  }
}

let assetsLoaded: Promise<void>;
function addAsset(asset: Promise<void>) {
  assetsLoaded ||= Promise.resolve();
  assetsLoaded = assetsLoaded.then(() => asset);
}


export { loadJson, loadImageFrom, loadSpritesheetFrom, loadSoundEffectsFrom, assetsLoaded };