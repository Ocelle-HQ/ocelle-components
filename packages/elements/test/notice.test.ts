import { afterEach, assert, describe, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-icon.ts";
import "../src/ocelle-notice.ts";
import { inProcessDriver } from "./in-process.ts";
import { matrixScenarios } from "./scenarios/notice-matrix.ts";
import { noticeLoadingScenario, noticeScenarios } from "./scenarios/notice.ts";

// User Story 1's browser scenarios for `ocelle-notice`, in process on the element source (specs/010-feedback-forms
// T013; 005 research.md R-11): the shared bodies of scenarios/notice.ts and the SC-002 matrix of
// scenarios/notice-matrix.ts on the in-process driver, at the in-process timing of test/in-process.ts; the first-load
// cells through `firstLoad` (`registerFirstLoad`), and US1-10's `"loading"` cell through `drive.readyState`. The same
// bodies run on the built browser build on strict-CSP fixture pages in test/browser/notice.test.ts. `ocelle-icon` is
// imported for the slotted icons of US1-18 and US1-19.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await driver.readyState(null);
  await driver.mount("");
});

describe("ocelle-notice, in process (US1)", { timeout: 30_000 }, () => {
  it.each(noticeScenarios)("$name", async ({ run }) => {
    assert.isUndefined(await run(driver, "ocelle-notice"));
  });

  it(noticeLoadingScenario.name, async () => {
    assert.isUndefined(await noticeLoadingScenario.run(driver, "ocelle-notice"));
  });
});

describe("ocelle-notice, the SC-002 matrix in process", { timeout: 30_000 }, () => {
  it.each(matrixScenarios)("$name", async ({ run }) => {
    assert.isUndefined(await run(driver, "ocelle-notice"));
  });
});
