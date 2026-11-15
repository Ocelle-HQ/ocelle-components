import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { OcelleFormInput } from "../src/ocelle-form-input.ts";
import { inProcessDriver } from "./in-process.ts";
import { formInputScenarios } from "./scenarios/form-input.ts";
import { restoreInProcess, twinScenarios } from "./scenarios/form-twins.ts";

// User Story 2's browser scenarios for `ocelle-form-input`, in process on the element source (specs/010-feedback-forms
// T033; 005 research.md R-11): the shared bodies of scenarios/form-input.ts and the native twins of
// scenarios/form-twins.ts on the in-process driver, at the in-process timing of test/in-process.ts, the first-load cells
// through `firstLoad` (`registerFirstLoad`); and the in-process restore test, which calls `formStateRestoreCallback`
// on the element directly (research R-09). The same shared bodies run on the built browser build on strict-CSP
// fixture pages in test/browser/form-input.test.ts, with the history-restore row there.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await driver.readyState(null);
  await driver.mount("");
});

describe("ocelle-form-input, in process (US2)", { timeout: 30_000 }, () => {
  it.each(formInputScenarios)("$name", async ({ run }) => {
    await expect(run(driver, "ocelle-form-input")).resolves.toBeUndefined();
  });
});

describe("ocelle-form-input, the native twins in process (SC-003, US2-21)", { timeout: 30_000 }, () => {
  it.each(twinScenarios)("$name", async ({ run }) => {
    await expect(run(driver, "ocelle-form-input")).resolves.toBeUndefined();
  });

  it(restoreInProcess.name, async () => {
    await expect(restoreInProcess.run(driver, "ocelle-form-input", OcelleFormInput)).resolves.toBeUndefined();
  });
});
