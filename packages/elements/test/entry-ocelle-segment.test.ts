import { describe, expect, it } from "vitest";
import { OcelleSegment } from "../src/ocelle-segment.ts";

// The `ocelle-segment` entry point (014 research.md R-16; contracts § Entry points; T063): importing only
// src/ocelle-segment.ts defines `ocelle-segment` as the class it exports, and not the segmented choice, which owns
// segments but is not owned by them. This file's own iframe (Vitest browser mode, isolate on) holds only what this
// import defines.
describe("importing src/ocelle-segment.ts", () => {
  it("defines ocelle-segment as OcelleSegment and not ocelle-segmented-choice", () => {
    expect({ segment: customElements.get("ocelle-segment"), group: customElements.get("ocelle-segmented-choice") }).toEqual({ segment: OcelleSegment, group: undefined });
  });
});
