import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-scroller.ts";
import "../src/ocelle-workflow-board.ts";
import "../src/ocelle-workflow-lane.ts";
import { inProcessDriver } from "./in-process.ts";
import { boardScenarios } from "./scenarios/board.ts";

// User Story 2's browser scenarios for `ocelle-workflow-board`, in process on the element source (009 research.md
// R-17, T033): the shared bodies of scenarios/board.ts on the in-process driver, so Stryker's mutants of
// src/ocelle-workflow-board.ts, src/ocelle-workflow-lane.ts and the overflow-region module the board uses are killed
// by real keys, focus and layout. The bodies with base.css mount it in process. The same bodies run on the built
// browser build on the strict-CSP fixture in test/browser/workflow-board.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
});

describe("ocelle-workflow-board, in process (US2)", { timeout: 60_000 }, () => {
  it.each(boardScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
