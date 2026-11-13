// PNG normalisation and the diff image of the visual gate (FR-005, FR-006, SC-006; research.md R-04, R-11): a capture
// is decoded and re-encoded by pngjs with fixed options (RGBA, 8 bits, deflate level 9, filter type 4) and no
// ancillary chunk, so the same pixels always give the same bytes; the diff image marks the differing pixels in
// magenta and dims the rest. Pure, tested in process (gates/test/png.test.ts).
import { PNG } from "pngjs";

/** An RGBA image, 8 bits per channel, rows top to bottom. */
export interface Image {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

/** The pixels of a PNG file. */
export function decode(bytes: Uint8Array): Image {
  const png = PNG.sync.read(Buffer.from(bytes));
  return { width: png.width, height: png.height, data: png.data };
}

/**
 * The PNG file of an image with the fixed options: deflate level 9 with zlib's RLE strategy (pngjs's default, under
 * which the level changes no byte), or another level (a plant's reencode) with zlib's default strategy, so the same
 * pixels come out in other bytes.
 */
export function encode(image: Image, deflateLevel = 9): Buffer {
  const png = new PNG({ width: image.width, height: image.height });
  png.data = Buffer.from(image.data);
  const deflateStrategy = deflateLevel === 9 ? 3 : 0;
  return PNG.sync.write(png, { colorType: 6, inputColorType: 6, bitDepth: 8, deflateLevel, deflateStrategy, filterType: 4 });
}

/** A PNG file re-encoded with the fixed options: the same pixels give the same bytes, whatever the input encoding. */
export function normalise(bytes: Uint8Array): Buffer {
  return encode(decode(bytes));
}

const magenta = [255, 0, 255, 255];

/** The RGBA pixel at (x, y), or undefined outside the image. */
function pixel(image: Image, x: number, y: number): number[] | undefined {
  if (x >= image.width || y >= image.height) return undefined;
  const at = (y * image.width + x) * 4;
  return [...image.data.subarray(at, at + 4)];
}

/** The diff image of two PNG files (differing pixels magenta, the rest dimmed) and the number of differing pixels. */
export function diffImage(a: Uint8Array, b: Uint8Array): { readonly image: Buffer; readonly pixels: number } {
  const first = decode(a);
  const second = decode(b);
  const width = Math.max(first.width, second.width);
  const height = Math.max(first.height, second.height);
  const data = new Uint8Array(width * height * 4);
  let pixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const one = pixel(first, x, y);
      const two = pixel(second, x, y);
      const same = one !== undefined && two !== undefined && one.every((value, channel) => value === two[channel]);
      if (!same) pixels += 1;
      // A kept pixel is dimmed three quarters of the way to white, so no kept pixel is ever magenta (its green is at least 191).
      const shown = same ? [...one.slice(0, 3).map((value) => Math.floor((value + 3 * 255) / 4)), 255] : magenta;
      data.set(shown, (y * width + x) * 4);
    }
  }
  return { image: encode({ width, height, data }), pixels };
}
