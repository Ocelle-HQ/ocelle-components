import { describe, expect, it } from "vitest";
import { run as axe } from "../bin/axe.ts";
import { run as baselines } from "../bin/baselines.ts";
import { run as storybookBuild } from "../bin/storybook-build.ts";
import { run as visual } from "../bin/visual.ts";

// The four entry stubs of specs/006-storybook-workbench tasks.md T003 (phase 1 review round 1, R1-01): each `run()`
// throws exactly its "not implemented" message, which the entry wrapper turns into exit 2 with that one line
// (gates/test/integration/entry-stubs.test.ts). Each stub's phase replaces it, red first.
describe("entry stubs", () => {
  it("storybook-build throws not implemented (storybook-build, phase 2)", () => {
    expect(() => storybookBuild()).toThrow(new Error("not implemented (storybook-build, phase 2)"));
  });

  it("visual throws not implemented (visual, phase 3)", () => {
    expect(() => visual()).toThrow(new Error("not implemented (visual, phase 3)"));
  });

  it("baselines throws not implemented (visual:update, phase 3)", () => {
    expect(() => baselines()).toThrow(new Error("not implemented (visual:update, phase 3)"));
  });

  it("axe throws not implemented (axe, phase 4)", () => {
    expect(() => axe()).toThrow(new Error("not implemented (axe, phase 4)"));
  });
});
