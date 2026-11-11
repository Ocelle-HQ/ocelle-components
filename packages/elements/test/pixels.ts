// Rendered pixels for the mirroring scenario (005 spec US2 scenario 4; research.md R-08; reviews/phase-3/spike.md):
// a PNG screenshot of an element's box decoded to RGBA, a horizontal flip, and R-08's two pixel rules. Both harnesses
// decode with this one decoder: the in-process driver inflates with the browser's DecompressionStream, the fixture
// driver with node:zlib. A screenshot is an 8-bit, non-interlaced RGB or RGBA PNG; anything else is a setup error.

/** An image as RGBA bytes, row by row. */
export interface Pixels {
  readonly width: number;
  readonly height: number;
  readonly data: ArrayLike<number>;
}

/** Inflates zlib data (a PNG's joined IDAT chunks). */
export type Inflate = (data: Uint8Array) => Promise<Uint8Array>;

const signature = [137, 80, 78, 71, 13, 10, 26, 10];

function uint32(bytes: Uint8Array, at: number): number {
  return ((bytes[at] ?? 0) * 2 ** 24) + (((bytes[at + 1] ?? 0) << 16) | ((bytes[at + 2] ?? 0) << 8) | (bytes[at + 3] ?? 0));
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Decodes a PNG of 8-bit RGB or RGBA without interlacing to RGBA. */
export async function decodePng(png: Uint8Array, inflate: Inflate): Promise<Pixels> {
  if (!signature.every((byte, index) => png[index] === byte)) throw new Error("not a PNG");
  let at = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const chunks: Uint8Array[] = [];
  while (at < png.length) {
    const length = uint32(png, at);
    const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
    const data = png.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      width = uint32(data, 0);
      height = uint32(data, 4);
      const [depth, colour, , , interlace] = data.subarray(8, 13);
      if (depth !== 8 || (colour !== 2 && colour !== 6) || interlace !== 0) throw new Error(`unsupported PNG: depth ${String(depth)}, colour type ${String(colour)}, interlace ${String(interlace)}`);
      channels = colour === 6 ? 4 : 3;
    }
    if (type === "IDAT") chunks.push(data);
    at += 12 + length;
  }
  const joined = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  const raw = await inflate(joined);
  const stride = width * channels;
  const out = new Uint8Array(width * height * 4);
  let previous = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start];
    const line = raw.slice(start + 1, start + 1 + stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? (line[i - channels] ?? 0) : 0;
      const b = previous[i] ?? 0;
      const c = i >= channels ? (previous[i - channels] ?? 0) : 0;
      const predictor = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter ?? 0];
      if (predictor === undefined) throw new Error(`unknown PNG row filter ${String(filter)}`);
      line[i] = ((line[i] ?? 0) + predictor) & 255;
    }
    for (let x = 0; x < width; x++) {
      for (let k = 0; k < 4; k++) out[(y * width + x) * 4 + k] = k < channels ? (line[x * channels + k] ?? 0) : 255;
    }
    previous = line;
  }
  return { width, height, data: out };
}

/** The image mirrored left to right. */
export function flipped(image: Pixels): Pixels {
  const data = new Uint8Array(image.width * image.height * 4);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      for (let k = 0; k < 4; k++) data[(y * image.width + x) * 4 + k] = image.data[(y * image.width + (image.width - 1 - x)) * 4 + k] ?? 0;
    }
  }
  return { width: image.width, height: image.height, data };
}

/** How two images of one size differ: per pixel, its largest per-channel difference, counted over 32, 64 and 96. */
export function difference(a: Pixels, b: Pixels): { readonly pixels: number; readonly over32: number; readonly over64: number; readonly over96: number } {
  if (a.width !== b.width || a.height !== b.height) throw new Error(`images of different sizes: ${String(a.width)} × ${String(a.height)} and ${String(b.width)} × ${String(b.height)}`);
  const pixels = a.width * a.height;
  let over32 = 0;
  let over64 = 0;
  let over96 = 0;
  for (let i = 0; i < pixels; i++) {
    let largest = 0;
    for (let k = 0; k < 4; k++) largest = Math.max(largest, Math.abs((a.data[i * 4 + k] ?? 0) - (b.data[i * 4 + k] ?? 0)));
    if (largest > 32) over32++;
    if (largest > 64) over64++;
    if (largest > 96) over96++;
  }
  return { pixels, over32, over64, over96 };
}

/** R-08's "equal": at most 1 % of the pixels differ by more than 32/255 in a channel, and none by more than 96/255. */
export function equal(a: Pixels, b: Pixels): boolean {
  const { pixels, over32, over96 } = difference(a, b);
  return over32 <= pixels / 100 && over96 === 0;
}

/** R-08's "differs": more than 5 % of the pixels differ by more than 64/255 in a channel. */
export function differs(a: Pixels, b: Pixels): boolean {
  const { pixels, over64 } = difference(a, b);
  return over64 > (pixels * 5) / 100;
}
