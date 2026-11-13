// The part of pngjs 7.0.0 the gates use (the package ships no types): the synchronous read and write of
// lib/png-sync.js and the PNG constructor's width, height and RGBA data (006 research.md R-04, R-11).
declare module "pngjs" {
  export interface PNGOptions {
    readonly width?: number;
    readonly height?: number;
  }

  export interface PNGWriteOptions {
    readonly colorType?: number;
    readonly inputColorType?: number;
    readonly bitDepth?: number;
    readonly deflateLevel?: number;
    readonly deflateStrategy?: number;
    readonly filterType?: number;
  }

  export class PNG {
    constructor(options?: PNGOptions);
    width: number;
    height: number;
    data: Buffer;
    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG, options?: PNGWriteOptions): Buffer;
    };
  }
}
