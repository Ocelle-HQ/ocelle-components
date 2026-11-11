import { crc32 } from "node:zlib";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { decode, diffImage, encode, normalise } from "../lib/png.ts";

// PNG normalisation and the diff image (FR-005, FR-006, SC-006; research.md R-04, R-11). The inputs are written here
// with pngjs directly, in several encodings, and with ancillary chunks spliced in by hand (pngjs deflates with zlib's
// RLE strategy by default, under which the level changes no byte, so other levels use zlib's default strategy, 0); the
// expected values are
// the pixels themselves, the PNG chunk layout and the dimming rule of the diff image (a pixel's channels three
// quarters of the way to white, floor((v + 3 * 255) / 4); differing pixels pure magenta).

/** A width × height RGBA image whose pixel (x, y) is `colour(x, y)`. */
function pixels(width: number, height: number, colour: (x: number, y: number) => readonly [number, number, number, number]): Buffer {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) data.set(colour(x, y), (y * width + x) * 4);
  }
  return data;
}

const gradient = (x: number, y: number): readonly [number, number, number, number] => [(x * 37) % 256, (y * 53) % 256, (x * y * 11) % 256, 255];

/** A PNG file of `data` written by pngjs with the given options. */
function write(width: number, height: number, data: Buffer, options: Record<string, number>): Buffer {
  const png = new PNG({ width, height });
  data.copy(png.data);
  return PNG.sync.write(png, options);
}

/** The chunk types of a PNG file, in order. */
function chunkTypes(file: Uint8Array): string[] {
  const bytes = Buffer.from(file);
  const types: string[] = [];
  for (let at = 8; at < bytes.length; ) {
    const length = bytes.readUInt32BE(at);
    types.push(bytes.toString("latin1", at + 4, at + 8));
    at += 12 + length;
  }
  return types;
}

/** The PNG file with an ancillary chunk of `type` holding `body` inserted right after IHDR. */
function withChunk(file: Buffer, type: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  const ihdrEnd = 8 + 12 + file.readUInt32BE(8);
  return Buffer.concat([file.subarray(0, ihdrEnd), head, body, crc, file.subarray(ihdrEnd)]);
}

/** The RGBA channels of pixel (x, y) of a decoded PNG file. */
function pixelAt(file: Uint8Array, x: number, y: number): number[] {
  const png = PNG.sync.read(Buffer.from(file));
  const at = (y * png.width + x) * 4;
  return [...png.data.subarray(at, at + 4)];
}

const width = 24;
const height = 16;
const data = pixels(width, height, gradient);

describe("normalise", () => {
  const encodings = {
    "deflate level 9, filter 4": write(width, height, data, { deflateLevel: 9, filterType: 4 }),
    "deflate level 1": write(width, height, data, { deflateLevel: 1, deflateStrategy: 0 }),
    "deflate level 0, filter 0": write(width, height, data, { deflateLevel: 0, filterType: 0 }),
    "adaptive filters": write(width, height, data, { deflateLevel: 6, deflateStrategy: 0, filterType: -1 }),
    "a tEXt chunk": withChunk(write(width, height, data, { deflateLevel: 3, deflateStrategy: 0 }), "tEXt", Buffer.from("Comment\0taken at noon", "latin1")),
    "a gAMA and a tIME chunk": withChunk(
      withChunk(write(width, height, data, { deflateLevel: 9 }), "gAMA", Buffer.from([0, 0, 0xb1, 0x8f])),
      "tIME",
      Buffer.from([0x07, 0xea, 11, 11, 12, 0, 0]),
    ),
  };

  it("gives the same bytes for the same pixels whatever the input encoding, ancillary chunks included", () => {
    const outputs = Object.values(encodings).map((file) => normalise(file));
    const inputs = new Set(Object.values(encodings).map((file) => file.toString("base64")));
    expect(inputs.size).toBe(6);
    expect(new Set(outputs.map((file) => file.toString("base64"))).size).toBe(1);
  });

  it("writes no ancillary chunk: IHDR, IDAT and IEND only, RGBA at 8 bits", () => {
    const file = normalise(encodings["a gAMA and a tIME chunk"]);
    expect(chunkTypes(encodings["a gAMA and a tIME chunk"])).toContain("tIME");
    expect([...new Set(chunkTypes(file))]).toEqual(["IHDR", "IDAT", "IEND"]);
    expect(chunkTypes(file).at(-1)).toBe("IEND");
    // IHDR: width, height, bit depth 8, colour type 6 (RGBA).
    expect([file.readUInt32BE(16), file.readUInt32BE(20), file[24], file[25]]).toEqual([width, height, 8, 6]);
  });

  it("keeps the pixels, and is its own fixed point", () => {
    const file = normalise(encodings["deflate level 1"]);
    expect(PNG.sync.read(file).data.equals(data)).toBe(true);
    expect(normalise(file).equals(file)).toBe(true);
  });

  it("reads an RGB input without alpha as opaque RGBA", () => {
    const rgb = write(2, 1, pixels(2, 1, (x) => [x * 200, 10, 20, 255]), { colorType: 2, inputColorType: 6 });
    expect(rgb[25]).toBe(2);
    const file = normalise(rgb);
    expect([pixelAt(file, 0, 0), pixelAt(file, 1, 0), file[25]]).toEqual([[0, 10, 20, 255], [200, 10, 20, 255], 6]);
  });
});

describe("decode and encode", () => {
  it("decode gives the RGBA pixels, encode writes them back; deflate level 1 (zlib's default strategy) gives other bytes for the same pixels", () => {
    const image = decode(write(width, height, data, { deflateLevel: 4 }));
    expect({ width: image.width, height: image.height, same: Buffer.from(image.data).equals(data) }).toEqual({ width, height, same: true });
    const nine = encode(image);
    const one = encode(image, 1);
    expect(nine.equals(normalise(one))).toBe(true);
    expect(one.equals(nine)).toBe(false);
    expect(PNG.sync.read(one).data.equals(data)).toBe(true);
    expect(one.equals(write(width, height, data, { colorType: 6, inputColorType: 6, bitDepth: 8, deflateLevel: 1, deflateStrategy: 0, filterType: 4 }))).toBe(true);
    expect(nine.equals(write(width, height, data, { colorType: 6, inputColorType: 6, bitDepth: 8, deflateLevel: 9, deflateStrategy: 3, filterType: 4 }))).toBe(true);
  });
});

describe("diffImage", () => {
  const a = write(3, 2, pixels(3, 2, () => [0, 0, 0, 255]), {});
  const changed = (x: number, y: number): readonly [number, number, number, number] => (x === 1 && y === 0 ? [255, 255, 255, 255] : [0, 0, 0, 255]);
  const b = write(3, 2, pixels(3, 2, changed), {});

  it("counts one differing pixel for one changed pixel (SC-006), and marks exactly that pixel in magenta", () => {
    const diff = diffImage(a, b);
    expect(diff.pixels).toBe(1);
    const marked: string[] = [];
    for (let y = 0; y < 2; y += 1) for (let x = 0; x < 3; x += 1) if (pixelAt(diff.image, x, y).join() === "255,0,255,255") marked.push(`${String(x)},${String(y)}`);
    expect(marked).toEqual(["1,0"]);
  });

  it("dims every other pixel of the first image three quarters of the way to white", () => {
    const first = write(2, 1, pixels(2, 1, (x) => (x === 0 ? [100, 200, 40, 255] : [0, 0, 0, 255])), {});
    const second = write(2, 1, pixels(2, 1, (x) => (x === 0 ? [100, 200, 40, 255] : [0, 0, 1, 255])), {});
    const diff = diffImage(first, second);
    expect({ pixels: diff.pixels, kept: pixelAt(diff.image, 0, 0), marked: pixelAt(diff.image, 1, 0) }).toEqual({
      pixels: 1,
      kept: [216, 241, 201, 255],
      marked: [255, 0, 255, 255],
    });
  });

  it("counts a difference in alpha only, and none between equal images (a dimmed black pixel is 191)", () => {
    const transparent = write(1, 1, pixels(1, 1, () => [0, 0, 0, 0]), {});
    expect(diffImage(a, a).pixels).toBe(0);
    expect(pixelAt(diffImage(a, a).image, 2, 1)).toEqual([191, 191, 191, 255]);
    expect(diffImage(write(1, 1, pixels(1, 1, () => [0, 0, 0, 255]), {}), transparent).pixels).toBe(1);
  });

  it("covers both sizes: every pixel outside one image differs, and the diff image is as large as the larger", () => {
    const tall = write(3, 3, pixels(3, 3, () => [0, 0, 0, 255]), {});
    const diff = diffImage(a, tall);
    const image = PNG.sync.read(diff.image);
    expect({ width: image.width, height: image.height, pixels: diff.pixels, row: [0, 1, 2].map((x) => pixelAt(diff.image, x, 2).join()) }).toEqual({
      width: 3,
      height: 3,
      pixels: 3,
      row: ["255,0,255,255", "255,0,255,255", "255,0,255,255"],
    });
    expect(diffImage(tall, write(4, 1, pixels(4, 1, () => [0, 0, 0, 255]), {})).pixels).toBe(4 * 3 - 3);
  });
});
