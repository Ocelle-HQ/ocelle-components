import { describe, expect, it } from "vitest";
import "../src/ocelle-workflow-board.ts";
import "../src/ocelle-workflow-lane.ts";
import { inProcessDriver } from "./in-process.ts";
import { laneScenarios } from "./scenarios/lane.ts";

// User Story 2's browser scenarios for `ocelle-workflow-lane`, in process on the element source (009 research.md R-17,
// T033): the shared bodies of scenarios/lane.ts on the in-process driver, so Stryker's mutants of
// src/ocelle-workflow-lane.ts and src/lane-count.ts are killed by the rendered lane and its tree. The same bodies run on
// the built browser build on the strict-CSP fixture in test/browser/workflow-board.test.ts.
const driver = inProcessDriver();

describe("ocelle-workflow-lane, in process (US2)", { timeout: 60_000 }, () => {
  it.each(laneScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
