import { describe, expect, it } from "vitest";
import { OcelleListDetail } from "../src/ocelle-list-detail.ts";

// The `ocelle-list-detail` entry point (009 FR-030; contracts/elements.md § Entry points; T051): importing only
// src/ocelle-list-detail.ts defines `ocelle-list-detail` as the class it exports and no other element of the package.
// This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
describe("importing src/ocelle-list-detail.ts", () => {
  it("defines ocelle-list-detail as OcelleListDetail, and neither ocelle-workflow-board, ocelle-workflow-lane, ocelle-scroller, ocelle-icon nor ocelle-brand-mark", () => {
    expect({
      listDetail: customElements.get("ocelle-list-detail"),
      board: customElements.get("ocelle-workflow-board"),
      lane: customElements.get("ocelle-workflow-lane"),
      scroller: customElements.get("ocelle-scroller"),
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
    }).toEqual({ listDetail: OcelleListDetail, board: undefined, lane: undefined, scroller: undefined, icon: undefined, mark: undefined });
    expect(OcelleListDetail).toBeTypeOf("function");
  });
});
