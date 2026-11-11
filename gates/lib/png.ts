// PNG normalisation and the diff image of the visual gate (FR-005, FR-006, SC-006; research.md R-04, R-11): a capture
// is decoded and re-encoded by pngjs with fixed options (RGBA, 8 bits, deflate level 9, filter type 4) and no
// ancillary chunk, so the same pixels always give the same bytes; the diff image marks the differing pixels in
// magenta and dims the rest. Pure, tested in process (gates/test/png.test.ts).

/** An RGBA image, 8 bits per channel, rows top to bottom. */
export interface Image {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

/** The pixels of a PNG file. */
export function decode(bytes: Uint8Array): Image {
  throw new Error(`not implemented (png, phase 3): ${String(bytes.length)}`);
}

/** The PNG file of an image with the fixed options, at deflate level 9 unless another is given (a plant's reencode). */
export function encode(image: Image, deflateLevel = 9): Buffer {
  throw new Error(`not implemented (png, phase 3): ${String(image.width)} ${String(deflateLevel)}`);
}

/** A PNG file re-encoded with the fixed options: the same pixels give the same bytes, whatever the input encoding. */
export function normalise(bytes: Uint8Array): Buffer {
  throw new Error(`not implemented (png, phase 3): ${String(bytes.length)}`);
}

/** The diff image of two PNG files (differing pixels magenta, the rest dimmed) and the number of differing pixels. */
export function diffImage(a: Uint8Array, b: Uint8Array): { readonly image: Buffer; readonly pixels: number } {
  throw new Error(`not implemented (png, phase 3): ${String(a.length)} ${String(b.length)}`);
}
