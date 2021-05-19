// SNES = 512×224 (16:7)
// This: nearby that but 16:9
const PLAYFIELD_WIDTH  = 512; // 16 * 32
const PLAYFIELD_HEIGHT = 288; // 16 * 18

const SCALE = 2;

const CANVAS_WIDTH  = PLAYFIELD_WIDTH  * SCALE;
const CANVAS_HEIGHT = PLAYFIELD_HEIGHT * SCALE;

function initializeCanvas(): HTMLCanvasElement{
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return canvas;
}

export {
  initializeCanvas,
  SCALE,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
}