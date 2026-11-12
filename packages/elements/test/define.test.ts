import { describe, expect, it } from "vitest";
import { define } from "../src/define.ts";

// Guarded registration (005 FR-006, research.md R-02, T014): `define` defines a free tag, and for a tag already
// defined it does nothing and throws nothing, so the first definition stays. Vitest's browser mode gives this file its
// own iframe, so its registry holds only what it defines (isolate stays on in the elements project).
class First extends HTMLElement {}
class Second extends HTMLElement {}
class Fresh extends HTMLElement {}

describe("define(tag, constructor)", () => {
  it("defines a free tag with the constructor", () => {
    define("ocelle-define-fresh", Fresh);
    expect(customElements.get("ocelle-define-fresh")).toBe(Fresh);
  });

  it("keeps the first class when the tag is defined twice with two classes, and throws nothing", () => {
    define("ocelle-define-twice", First);
    expect(() => {
      define("ocelle-define-twice", Second);
    }).not.toThrow();
    expect(customElements.get("ocelle-define-twice")).toBe(First);
    expect(document.createElement("ocelle-define-twice")).toBeInstanceOf(First);
  });
});
