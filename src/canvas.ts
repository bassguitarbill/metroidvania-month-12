// SNES = 512×224 (16:7)
// This: nearby that but 16:9

const PLAYFIELD_WIDTH = 384;  // 16 * 24
const GUI_WIDTH = 128;        // 16 * 8

const PLAYFIELD_HEIGHT = 288; // 16 * 18

const GAME_WIDTH = PLAYFIELD_WIDTH + GUI_WIDTH;
const GAME_HEIGHT = PLAYFIELD_HEIGHT;

const SCALE = 2;

const CANVAS_WIDTH  = GAME_WIDTH  * SCALE;
const CANVAS_HEIGHT = GAME_HEIGHT * SCALE;

function initializeCanvas(): HTMLCanvasElement{
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  function resizeCanvas() {
    canvas.style.top = `${window.innerHeight/2 - canvas.height/2}px`;
    canvas.style.left = `${window.innerWidth/2 - canvas.width/2}px`;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  return canvas;
}


export {
  initializeCanvas,
  SCALE,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
}