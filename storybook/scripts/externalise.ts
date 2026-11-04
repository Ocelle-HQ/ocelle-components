// The post-build step of the Storybook (FR-023, research.md R-10): moves every inline script and style of the built
// HTML entries to same-origin files. Scaffold: no behaviour yet.
/* eslint-disable @typescript-eslint/no-unused-vars -- scaffold: signatures only, the green commit implements them */

/** A file the externaliser writes beside the HTML entry. */
export interface MovedFile {
  readonly name: string;
  readonly text: string;
}

/** An HTML entry with its inline scripts and styles moved out, and the files they moved to. */
export interface Externalised {
  readonly html: string;
  readonly files: readonly MovedFile[];
}

/** Moves the inline scripts, style elements and style attributes of one HTML text out. */
export function externalise(html: string): Externalised {
  return { html, files: [] };
}

/** Externalises every `*.html` directly inside `dir`, writing the moved files beside them. */
export function externaliseDir(dir: string): void {
  throw new Error("not implemented");
}
