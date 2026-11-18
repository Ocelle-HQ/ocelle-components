import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-data-table.ts";
import { inProcessDriver } from "./in-process.ts";
import { dataTableTouchScenarios } from "./scenarios/data-table.ts";

// US1-24's no-hover half (019 re-analysis A2 (a); contracts/checks.md § Oracles, pointer; tasks.md T010), in process
// on the element source in 008's `elements-touch` project (a context with `hasTouch`, where Chromium matches
// `(hover: none)`): `device().hover` false first, then a tapped striped even row and a hovered odd row paint no hover
// ground. The same body runs on the strict-CSP fixture in test/browser/data-table.touch.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
});

describe("ocelle-data-table, in process, touch context (US1-24)", { timeout: 30_000 }, () => {
  for (const { name, run, expected } of dataTableTouchScenarios) {
    it(name, async () => {
      expect(await run(driver)).toEqual(expected);
    });
  }
});
