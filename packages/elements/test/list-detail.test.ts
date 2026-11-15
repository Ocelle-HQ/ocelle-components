import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-list-detail.ts";
import "./fixtures/list-detail-controls.ts";
import { inProcessDriver } from "./in-process.ts";
import { listDetailGuards, listDetailScenarios } from "./scenarios/list-detail.ts";

// User Story 3's browser scenarios for `ocelle-list-detail`, in process on the element source (009 research.md R-17,
// T050): the shared bodies of scenarios/list-detail.ts on the in-process driver, so Stryker's mutants of
// src/ocelle-list-detail.ts, src/tiers.ts and src/list-detail-measure.ts are killed by real layout, keys, clicks and
// focus. The bodies with base.css mount it in process. The same bodies run on the built browser build on the
// strict-CSP fixture in test/browser/list-detail.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
});

describe("ocelle-list-detail, in process (US3)", { timeout: 60_000 }, () => {
  it.each([...listDetailScenarios, ...listDetailGuards])("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
