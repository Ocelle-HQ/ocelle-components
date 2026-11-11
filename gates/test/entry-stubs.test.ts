import { describe, expect, it } from "vitest";
import { run as axe } from "../bin/axe.ts";

// The entry stubs of specs/006-storybook-workbench tasks.md T003 (phase 1 review round 1, R1-01): each `run()`
// throws exactly its "not implemented" message, which the entry wrapper turns into exit 2 with that one line
// (gates/test/integration/entry-stubs.test.ts). Each stub's phase replaces it, red first: phase 2 replaced the
// storybook-build stub with the gate (gates/test/storybook-build.test.ts, gates/test/integration/storybook-build.test.ts),
// phase 3 the visual and visual:update stubs with the gate and the baseline command (gates/test/integration/visual.test.ts).
describe("entry stubs", () => {
  it("axe throws not implemented (axe, phase 4)", () => {
    expect(() => axe()).toThrow(new Error("not implemented (axe, phase 4)"));
  });
});
