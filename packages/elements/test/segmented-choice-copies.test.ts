import { describe, expect, it } from "vitest";

// Two copies of the package on one page, the other copy first (014 spec Edge Cases "Two copies of the package";
// research.md R-06, R-16; contracts § `ocelle-segmented-choice`): another copy has already defined `ocelle-segment`
// (here a plain class with none of this copy's internals) when this copy's `ocelle-segmented-choice` module is
// imported. The first definition of `ocelle-segment` stays; the group still presses and writes its states on those
// segments, and in the joined variant leaves them unrounded, because it sets row states only through a segment's
// internal method when the segment has it: nothing is thrown, no error event and no console error. This file's own
// iframe (Vitest browser mode, isolate on) holds only these definitions. Mutant: calling the row-state method without
// the feature check (a TypeError on the other copy's segments).
describe("a joined ocelle-segmented-choice over segments of another copy of the package", () => {
  it("presses, writes the states and throws nothing, with no error event, beside the first definition of ocelle-segment kept", async () => {
    class OtherSegment extends HTMLElement {}
    customElements.define("ocelle-segment", OtherSegment);
    const errors: string[] = [];
    window.addEventListener("error", (event) => errors.push(event.message));
    await import("../src/ocelle-segmented-choice.ts");
    document.body.innerHTML = '<ocelle-segmented-choice id="sc" label="Lane filter" value="mine" joined><ocelle-segment value="all">All</ocelle-segment><ocelle-segment value="mine">Mine</ocelle-segment></ocelle-segmented-choice>';
    const group = document.getElementById("sc") as unknown as { value: string; updateComplete: Promise<unknown> };
    await group.updateComplete;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const segments = [...document.querySelectorAll("#sc > ocelle-segment")];
    expect({
      segmentClass: customElements.get("ocelle-segment"),
      value: group.value,
      pressed: segments.map((each) => each.getAttribute("aria-pressed")),
      tabindexes: segments.map((each) => each.getAttribute("tabindex")),
      errors,
    }).toEqual({ segmentClass: OtherSegment, value: "mine", pressed: ["false", "true"], tabindexes: ["-1", "0"], errors: [] });
  });
});
