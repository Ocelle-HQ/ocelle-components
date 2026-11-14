import { describe, expect, it } from "vitest";
import "../src/ocelle-dialog.ts";
import { inProcessDriver } from "./in-process.ts";
import { defineDialogStandIns, repeatedEscapeScenario } from "./scenarios/dialog.ts";

// The veto-then-Escape-twice case of matrix § Dialog "Escape with slotted content" in process, on a page of its own
// (008 operator decision 2026-11-14, R-02; reviews/phase-2/measure.md): in Chromium whether the platform's second
// `cancel` is cancelable depends on the page's history of user activations and vetoed cancels, so the shared body runs
// here, in this file's fresh page, rather than after the other rows of test/dialog.test.ts. The fixture runs it on a
// page of its own too (test/browser/dialog.test.ts).
defineDialogStandIns();
const driver = inProcessDriver();

describe("ocelle-dialog, in process, on a page of its own (US1)", () => {
  it(repeatedEscapeScenario.name, async () => {
    expect(await repeatedEscapeScenario.run(driver)).toEqual(repeatedEscapeScenario.expected);
  });
});
