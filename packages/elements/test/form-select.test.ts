import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { OcelleFormSelect } from "../src/ocelle-form-select.ts";
import { inProcessDriver } from "./in-process.ts";
import { formSelectScenarios } from "./scenarios/form-select.ts";
import { selectRestoreInProcess, selectTwinScenarios } from "./scenarios/form-twins.ts";

// User Story 3's browser scenarios for `ocelle-form-select`, in process on the element source (specs/010-feedback-forms
// T051; 005 research.md R-11): the shared bodies of scenarios/form-select.ts (with User Story 2's bodies that US3
// scenario 7 reuses, run on the select) and the select's native twins of scenarios/form-twins.ts on the in-process
// driver, at the in-process timing of test/in-process.ts; and the in-process restore test, which calls
// `formStateRestoreCallback` on the element directly. The same shared bodies run on the built browser build on
// strict-CSP fixture pages in test/browser/form-select.test.ts, with the history-restore row there.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await driver.readyState(null);
  await driver.mount("");
});

describe("ocelle-form-select, in process (US3)", { timeout: 30_000 }, () => {
  it.each(formSelectScenarios)("$name", async ({ run }) => {
    await expect(run(driver, "ocelle-form-select")).resolves.toBeUndefined();
  });
});

describe("ocelle-form-select, the native twins in process (SC-003, US3-5, US3-6)", { timeout: 30_000 }, () => {
  it.each(selectTwinScenarios)("$name", async ({ run }) => {
    await expect(run(driver, "ocelle-form-select")).resolves.toBeUndefined();
  });

  it(selectRestoreInProcess.name, async () => {
    await expect(selectRestoreInProcess.run(driver, "ocelle-form-select", OcelleFormSelect)).resolves.toBeUndefined();
  });
});
