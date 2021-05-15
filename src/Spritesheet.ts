class Spritesheet {
  constructor(readonly image: HTMLImageElement, readonly width: number, readonly height: number) {}

  static async load(path: string, width: number, height :number): Promise<Spritesheet> {
    return new Promise((resolve) => {
      const image = new Image;
      image.src = path;
      image.addEventListener('load', _ => resolve(new Spritesheet(image, width, height)));
    })
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, spriteX: number, spriteY: number) {
    ctx.drawImage(this.image, spriteX * this.width, spriteY * this.height, this.width, this.height, x, y, this.width, this.height);
  }

  get columns() {
    return this.image.width / this.width;
  }

  get rows() {
    return this.image.height / this.height;
  }
}

export default Spritesheet;