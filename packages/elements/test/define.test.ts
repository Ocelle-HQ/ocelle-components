import { describe, expect, it } from "vitest";
import { define, registering } from "../src/define.ts";

// Guarded registration (005 FR-006, research.md R-02, T014): `define` defines a free tag, and for a tag already
// defined it does nothing and throws nothing, so the first definition stays. Vitest's browser mode gives this file its
// own iframe, so its registry holds only what it defines (isolate stays on in the elements project).
class First extends HTMLElement {}
class Second extends HTMLElement {}
class Fresh extends HTMLElement {}

// The registration flag (specs/010-feedback-forms research.md R-02, FR-008; T019): `registering()` reads true only
// while a `define` call's `customElements.define` runs. This describe comes first, so its first reading is taken
// before any `define` call of the file.
describe("registering()", () => {
  it("reads false before any define call, true in a constructor the registration's upgrade runs, false after it and in a later constructor", () => {
    const before = registering();
    const seen: boolean[] = [];
    class Probe extends HTMLElement {
      constructor() {
        super();
        seen.push(registering());
      }
    }
    document.body.insertAdjacentHTML("beforeend", '<ocelle-define-probe id="probe"></ocelle-define-probe>');
    define("ocelle-define-probe", Probe);
    const after = registering();
    document.createElement("ocelle-define-probe");
    document.getElementById("probe")?.remove();
    expect({ before, seen, after }).toEqual({ before: false, seen: [true, false], after: false });
  });
});

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
