import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { define } from "../src/define.ts";
import { Announcer, announcerDefaults } from "../src/live.ts";
import { OcelleFormInput } from "../src/ocelle-form-input.ts";
import "../src/ocelle-notice.ts";
import { emptyStartCase, emptyStartMessage } from "./announcer-rules.ts";
import type { MakeAnnouncer } from "./announcer-rules.ts";
import { defineFormInputPlants } from "./fixtures/form-input-plants.ts";
import { defineFormSelectPlants } from "./fixtures/form-select-plants.ts";
import { loopMarkup } from "./fixtures/live-loop.ts";
import { plainRegion } from "./fixtures/live-regions.ts";
import { IgnoresEmptyStart, noticePlants } from "./fixtures/notice-plants.ts";
import { imgDescendants, linkName, noKeepingRule } from "./fixtures/reading-plants.ts";
import { firstTimingReturn, inProcessDriver, withTiming } from "./in-process.ts";
import { announcements, regionText } from "./live-reading.ts";
import { checkShippedTiming } from "./live-timing-check.ts";
import { caseNamed } from "./live-rules.ts";
import type { Driver } from "./scenarios/driver.ts";
import { formInputScenario } from "./scenarios/form-input.ts";
import type { FormScenario } from "./scenarios/form-input.ts";
import { formSelectScenario } from "./scenarios/form-select.ts";
import { restoreInProcess, twinScenario } from "./scenarios/form-twins.ts";
import { matrixScenarios } from "./scenarios/notice-matrix.ts";
import { noticeLoadingScenario, noticeScenario } from "./scenarios/notice.ts";
import type { NoticeScenario } from "./scenarios/notice.ts";

// The plant rows of the elements-timing project (specs/010-feedback-forms contracts/testing.md § Plants; T001c; one of
// the timing files that run one at a time since operator round 7, O7-01). A row names
// the family, the plant, the body it runs and the assertion message that body must fail with; it runs the body with the
// plant, which must reject with that message, and the same body without the plant, which must pass, so a plant that
// does not bite, or a body that fails on its own, fails the row. Phase 1's rows: the oracle reading (planted readings
// of test/fixtures/reading-plants.ts on the named cases of test/live-rules.ts) and the capture bounds in process (the
// looping element of test/fixtures/live-loop.ts). Rows that run under `liveCapture.startDocument` are in
// test/browser/plants.test.ts. Phase 2's rows (T016): every row of contracts/testing.md § Plants whose "must turn
// red" names US1, SC-002, `live-timing`, the first-load paths or a notice Edge case, each cell a notice scenario body
// (test/scenarios/notice.ts, notice-matrix.ts) run with the plant's tag (test/fixtures/notice-plants.ts) and with
// `ocelle-notice`; the shipped-timing rows call `checkShippedTiming` with planted values, after the unplanted call.
// The "empty-state start" row (T025a, phase 2 stop 2) runs the fake-clock rule case of test/announcer-rules.ts with the
// plant's announcer and with `Announcer`, under the shipped timing's two `D` values. Phase 3's rows (T034): the form,
// naming, error, host ARIA, change event, implicit submission, validity and form value rows and the US2 cells of the
// rows phase 2 began, each cell an input scenario body (test/scenarios/form-input.ts, form-twins.ts) run with a plant
// class derived from `ocelle-form-input` (test/fixtures/form-input-plants.ts) and with `ocelle-form-input`. Phase 4's
// rows (T052): the option mirroring and indicator rows and the validity row's US3-5 cell, each a select scenario body
// (test/scenarios/form-select.ts) run with a plant class derived from `ocelle-form-select`
// (test/fixtures/form-select-plants.ts) and with `ocelle-form-select`.
interface Row {
  readonly family: string;
  readonly plant: string;
  readonly body: string;
  readonly message: RegExp;
  readonly planted: () => Promise<unknown>;
  readonly unplanted: () => Promise<unknown>;
}

const reading = { regionText, announcements };
const driver = inProcessDriver();

for (const [tag, plant] of Object.entries(noticePlants)) define(tag, plant);
defineFormInputPlants();
defineFormSelectPlants();

/** An input row: the scenario body with the plant's tag, and with `ocelle-form-input`. */
function inputRow(family: string, plant: string, tag: string, body: FormScenario, message: RegExp): Row {
  return {
    family,
    plant,
    body: body.name.slice(0, body.name.indexOf(":")),
    message,
    planted: () => body.run(driver, tag),
    unplanted: () => body.run(driver, "ocelle-form-input").then(() => "passed"),
  };
}

const input = formInputScenario;

/** A select row: the scenario body with the plant's tag, and with `ocelle-form-select`. */
function selectRow(family: string, plant: string, tag: string, body: FormScenario, message: RegExp): Row {
  return {
    family,
    plant,
    body: body.name.slice(0, body.name.indexOf(":")),
    message,
    planted: () => body.run(driver, tag),
    unplanted: () => body.run(driver, "ocelle-form-select").then(() => "passed"),
  };
}
const restore: FormScenario = { name: restoreInProcess.name, run: (_inProcess, tag) => restoreInProcess.run(driver, tag, OcelleFormInput) };

/** A notice row: the scenario body (by its name's start) with the plant's tag, and with `ocelle-notice`. */
function noticeRow(family: string, plant: string, tag: string, scenario: NoticeScenario | string, message: RegExp): Row {
  const body = typeof scenario === "string" ? noticeScenario(scenario) : scenario;
  return {
    family,
    plant,
    body: body.name.slice(0, body.name.indexOf(":")),
    message,
    planted: () => body.run(driver, tag),
    unplanted: () => body.run(driver, "ocelle-notice").then(() => "passed"),
  };
}

const matrixAlert = matrixScenarios.find((scenario) => scenario.name.startsWith("SC-002 alert danger"));
const matrixNoneInfo = matrixScenarios.find((scenario) => scenario.name.startsWith("SC-002 none info"));
const loading = { name: noticeLoadingScenario.name, run: (_inProcess: Driver, tag: string) => noticeLoadingScenario.run(driver, tag) };

/** The shipped-timing check, unplanted (the real values) and planted. */
const shipped = {
  unplanted: () =>
    Promise.resolve().then(() => {
      checkShippedTiming(announcerDefaults, firstTimingReturn());
      return "passed";
    }),
};

/** The fake-clock rule case of the wait's floor for announcers of class `make`, under the shipped timing. */
function emptyStart(make: MakeAnnouncer): Promise<unknown> {
  return Promise.resolve().then(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    try {
      withTiming(announcerDefaults, () => {
        emptyStartCase(make);
      });
    } finally {
      vi.useRealTimers();
    }
    return "passed";
  });
}

/** The capture-bounds body: a capture over the container while `markup` is in it. */
async function bounds(run: Driver, markup: string): Promise<unknown> {
  await run.mount('<main id="c"></main>');
  await run.liveCapture.start("c");
  await run.insert("c", markup, "innerHTML");
  return run.liveCapture.stop();
}

/** A reading row: the named case with the planted reading, and with the reading of live-reading.ts. */
function readingRow(plant: string, body: string, planted: typeof reading, message: RegExp): Row {
  return {
    family: "oracle reading",
    plant,
    body,
    message,
    planted: () => Promise.resolve().then(() => {
      caseNamed(body).run(planted);
    }),
    unplanted: () => Promise.resolve().then(() => {
      caseNamed(body).run(reading);
    }),
  };
}

const rows: readonly Row[] = [
  readingRow("takes a link's own name", "a link's own name skipped and its StaticText children taken", linkName, /expected 'Open Report link the report' to be 'Open the report'/),
  readingRow("visits an img's descendants", "an img's name taken and its descendants not visited", imgDescendants, /expected 'Disk full Star inner now' to be 'Disk full Star now'/),
  readingRow("ignores the keeping rule", "a state set and cleared in one task is kept by neither rule", noKeepingRule, /to deeply equal/),
  noticeRow("insertion announcement", "announcer created already holding the text (no empty wait)", "ocelle-plant-no-wait", "US1-8 innerHTML", /^US1-8 innerHTML: announcements/),
  noticeRow("insertion announcement", "announcer created already holding the text (no empty wait)", "ocelle-plant-no-wait", "US1-15 status insertion", /^US1-15 status insertion: announcements/),
  noticeRow("insertion announcement", "announcer created already holding the text (no empty wait)", "ocelle-plant-no-wait", "US1-15 status reveal", /^US1-15 status reveal: announcements/),
  noticeRow("alert path", "writes the copy for a role=\"alert\" host", "ocelle-plant-alert-copies", "US1-15 alert insertion", /^US1-15 alert insertion: announcements/),
  noticeRow("alert path", "writes the copy for a role=\"alert\" host", "ocelle-plant-alert-copies", "US1-15 alert reveal", /^US1-15 alert reveal: announcements/),
  noticeRow("alert path", "writes the copy for a role=\"alert\" host", "ocelle-plant-alert-copies", "US1-15 status to alert", /^US1-15 status to alert: announcements/),
  noticeRow("alert path", "writes the copy for a role=\"alert\" host", "ocelle-plant-alert-copies", matrixAlert ?? "SC-002 alert danger", /^SC-002 alert danger insertion: announcements/),
  noticeRow("alert baseline", "the alert path takes the baseline at the DOM operation", "ocelle-plant-alert-baseline-now", "US1-15 alert, text set in the same task after insertion", /^US1-15 alert, text after insertion: announcements/),
  noticeRow("alert baseline", "the alert path takes the baseline at the DOM operation", "ocelle-plant-alert-baseline-now", "US1-15 alert, text set in the same task after the reveal", /^US1-15 alert, text after reveal: announcements/),
  noticeRow("alert baseline", "the alert path takes the baseline at the DOM operation", "ocelle-plant-alert-baseline-now", "US1-15 alert, text set in the same task after the role change", /^US1-15 alert, text after role change: announcements/),
  noticeRow("alert pending role", "alert to status while pending leaves the marker set", "ocelle-plant-alert-pending-role", "US1-15 inserted as alert", /^US1-15 inserted as alert, to status: announcements/),
  noticeRow("alert pending role", "alert to status while pending leaves the marker set", "ocelle-plant-alert-pending-role", "US1-15 revealed as alert", /^US1-15 revealed as alert, to status: announcements/),
  noticeRow("alert step after reset", "the end-of-task step sets the baseline after the marker was reset", "ocelle-plant-alert-step-after-reset", "US1-15 inserted as alert", /^US1-15 inserted as alert, to status: announcements/),
  noticeRow("alert step after reset", "the end-of-task step sets the baseline after the marker was reset", "ocelle-plant-alert-step-after-reset", "US1-15 revealed as alert", /^US1-15 revealed as alert, to status: announcements/),
  noticeRow("merge window", "no restart: each trigger writes after its own wait", "ocelle-plant-no-restart", "US1-13 100 ms apart", /^US1-13 100 ms apart: announcements/),
  noticeRow("minimum hold", "a trigger during the hold empties the copy at once", "ocelle-plant-no-minimum-hold", "US1-13 10 ms after a write", /^US1-13 10 ms after a write: announcements/),
  noticeRow("baseline re-check", "writes at the end of the wait without comparing", "ocelle-plant-no-recheck", "US1-13 A, B, A", /^US1-13 A, B, A: announcements/),
  noticeRow("reveal baseline", "the re-check also applies to insertion and reveal", "ocelle-plant-keeps-baseline", "US1-8 innerHTML", /^US1-8 innerHTML: announcements/),
  noticeRow("reveal baseline", "the re-check also applies to insertion and reveal", "ocelle-plant-keeps-baseline", "US1-17 first loaded hidden", /^US1-17 first loaded hidden: announcements/),
  noticeRow("reveal baseline", "the re-check also applies to insertion and reveal", "ocelle-plant-keeps-baseline", "US1-17 announced, hidden and revealed", /^US1-17 announced, hidden and revealed: announcements/),
  noticeRow("hold", "empties the copy after W instead of H", "ocelle-plant-short-hold", "US1-13 hold", /^US1-13 hold: held/),
  noticeRow("first load, late write", "writes exactly the pre-load W after first load", "ocelle-plant-late-write", loading, /^US1-10 loading: announcements/),
  noticeRow("short-lived empty state", "text written in a microtask after the announcer appears", "ocelle-plant-microtask-write", "US1-8 innerHTML", /^US1-8 innerHTML: announcements/),
  noticeRow("short-lived empty state", "text written in the first animation frame", "ocelle-plant-frame-write", "US1-8 innerHTML", /^US1-8 innerHTML: announcements/),
  noticeRow("first load", "the constructor's isConnected rule", "ocelle-plant-constructed-connected", "US1-8 innerHTML", /^US1-8 innerHTML: announcements/),
  noticeRow("first load", "the constructor's isConnected rule", "ocelle-plant-constructed-connected", "US1-8 template", /^US1-8 template: announcements/),
  noticeRow("first load", "the constructor's isConnected rule", "ocelle-plant-constructed-connected", "US1-8 domparser", /^US1-8 domparser: announcements/),
  noticeRow("first load, deaf window", "light-DOM changes ignored for 100 ms after a first load", "ocelle-plant-deaf-after-first-load", "US1-11 text", /^US1-11 text: announcements/),
  noticeRow("first load, deaf window", "light-DOM changes ignored for 100 ms after a first load", "ocelle-plant-deaf-after-first-load", "US1-13 one task", /^US1-13 one task: announcements/),
  noticeRow("first load, deaf window", "light-DOM changes ignored for 100 ms after a first load", "ocelle-plant-deaf-after-first-load", matrixNoneInfo ?? "SC-002 none info", /^SC-002 none info [a-z-]+: announcements/),
  {
    family: "empty-state start",
    plant: "the wait ignores the empty state's start",
    body: "the fake-clock rule case with two D values (test/announcer-rules.ts)",
    message: new RegExp(`^${emptyStartMessage}: `),
    planted: () => emptyStart(IgnoresEmptyStart),
    unplanted: () => emptyStart(Announcer),
  },
  noticeRow("first load", "announces on first load", "ocelle-plant-never-first-load", "US1-10 first load only", /^US1-10 first load only: announcements/),
  noticeRow("nested region", "the content wrapper also carries aria-live", "ocelle-plant-nested-region", "US1-15 status text change", /^US1-15 status text change: announcements/),
  noticeRow("host-role region", "internals.ariaLive left unset", "ocelle-plant-host-region", "US1-15 status text change", /^US1-15 status text change: announcements/),
  noticeRow("politeness", "always polite", "ocelle-plant-always-polite", "US1-9 innerHTML", /^US1-9 innerHTML: announcements/),
  noticeRow("politeness", "always polite", "ocelle-plant-always-polite", "US1-12:", /^US1-12: announcements/),
  noticeRow("politeness", "always polite", "ocelle-plant-always-polite", "US1-15 runtime roles", /^US1-15 runtime roles, text change: announcements/),
  noticeRow("politeness baseline", "announces on any tone change", "ocelle-plant-any-tone", "US1-12:", /^US1-12: announcements/),
  noticeRow("move", "move flag never set", "ocelle-plant-no-move", "US1-11 move", /^US1-11 move: announcements/),
  noticeRow("later task", "move flag never cleared", "ocelle-plant-move-forever", "Edge case, later task", /^Edge case, later task: announcements/),
  noticeRow("text baseline", "compares with the last written copy before normalising", "ocelle-plant-raw-baseline", "US1-11 same text", /^US1-11 same text: announcements/),
  noticeRow("text baseline", "compares with the last written copy before normalising", "ocelle-plant-raw-baseline", "Edge case, whitespace", /^Edge case, whitespace: announcements/),
  noticeRow("hidden", "announces while hidden (the hidden attribute ignored)", "ocelle-plant-ignores-hidden", "US1-17 inserted hidden", /^US1-17 inserted hidden: announcements/),
  noticeRow("hidden", "announces while hidden (the hidden attribute ignored)", "ocelle-plant-ignores-hidden", "US1-17 first loaded hidden", /^US1-17 first loaded hidden: announcements/),
  noticeRow("hidden", "announces while hidden (the hidden attribute ignored)", "ocelle-plant-ignores-hidden", "US1-17 announced, hidden and revealed", /^US1-17 announced, hidden and revealed: announcements/),
  noticeRow("heading gap", "the heading part not hidden when absent", "ocelle-plant-heading-always", "US1-4, SC-004", /^US1-4, SC-004: heading absent/),
  // The US2 cells and rows (T034).
  inputRow("insertion announcement", "announcer created already holding the error (no empty wait)", "ocelle-plant-input-no-wait", input("US2-20 innerHTML"), /^US2-20 innerHTML: announcements/),
  inputRow("reveal baseline", "the re-check also applies to insertion and reveal", "ocelle-plant-input-keeps-baseline", input("US2-22 first loaded hidden"), /^US2-22 first loaded hidden: announcements/),
  inputRow("reveal baseline", "the re-check also applies to insertion and reveal", "ocelle-plant-input-keeps-baseline", input("US2-22 announced, hidden and revealed"), /^US2-22 announced, hidden and revealed: announcements/),
  ...(["innerHTML", "template", "domparser"] as const).map((how) =>
    inputRow("first load", "the constructor's isConnected rule", "ocelle-plant-input-constructed-connected", input(`US2-20 ${how}`), new RegExp(`^US2-20 ${how}: announcements`)),
  ),
  inputRow("first load", "announces on first load", "ocelle-plant-input-never-first-load", input("US2-18"), /^US2-18: announcements/),
  inputRow("move", "move flag never set", "ocelle-plant-input-no-move", input("US2-20 move"), /^US2-20 move: announcements/),
  inputRow("hidden", "announces while hidden (the hidden attribute ignored)", "ocelle-plant-input-ignores-hidden", input("US2-22 inserted hidden"), /^US2-22 inserted hidden: announcements/),
  inputRow("hidden", "announces while hidden (the hidden attribute ignored)", "ocelle-plant-input-ignores-hidden", input("US2-22 first loaded hidden"), /^US2-22 first loaded hidden: announcements/),
  inputRow("validity", "setValidity({}) always", "ocelle-plant-input-always-valid", input("US2-5:"), /^US2-5: /),
  inputRow("validity", "setValidity({}) always", "ocelle-plant-input-always-valid", input("US2-6:"), /^US2-6: /),
  inputRow("error baseline", "clearing does not reset the baseline", "ocelle-plant-input-clear-keeps-baseline", input("US2-10:"), /^US2-10: announcements/),
  inputRow("error baseline", "no whitespace normalisation", "ocelle-plant-input-raw-error", input("US2-10:"), /^US2-10: announcements/),
  inputRow("host ARIA", 'ignores host aria-invalid="true"', "ocelle-plant-input-ignores-host-invalid", input("US2-23:"), /^US2-23: /),
  inputRow("host ARIA", 'lets host "false" clear the element\'s own state', "ocelle-plant-input-host-false-clears", input("US2-23:"), /^US2-23: /),
  inputRow("naming", "name span not hidden", "ocelle-plant-input-visible-name", input("US2-1:"), /^US2-1: expected/),
  inputRow("naming", "name not recomputed on label text change", "ocelle-plant-input-unobserved-labels", input("US2-13 rename"), /^US2-13 rename: /),
  inputRow("change event", "no last-committed guard", "ocelle-plant-input-no-commit-guard", input("US2-3:"), /^US2-3: /),
  inputRow("implicit submission", "never submits", "ocelle-plant-input-never-submits", twinScenario("US2-21 button:"), /^US2-21 button: /),
  inputRow("implicit submission", "submits ignoring the one-field rule", "ocelle-plant-input-ignores-one-field", twinScenario("US2-21 two fields"), /^US2-21 two fields: /),
  inputRow("form value", "forgets setFormValue", "ocelle-plant-input-forgets-form-value", input("US2-2:"), /^US2-2: /),
  inputRow("form value", "reset keeps the typed value", "ocelle-plant-input-reset-keeps", input("US2-4:"), /^US2-4: /),
  inputRow("form value", "restore ignored", "ocelle-plant-input-restore-ignored", restore, /^SC-003 restore in process: expected/),
  // The US3 cells and rows (T052).
  selectRow("validity", "setValidity({}) always", "ocelle-plant-select-always-valid", formSelectScenario("US3-5:"), /^US3-5: /),
  selectRow("option mirroring", "the option observer misses characterData", "ocelle-plant-select-misses-character-data", formSelectScenario("US3-4:"), /^US3-4: /),
  selectRow("indicator", "indicator without pointer-events: none", "ocelle-plant-select-indicator-pointer", formSelectScenario("US3-8:"), /^US3-8: /),
  {
    family: "shipped timing",
    plant: "announcerDefaults with delayLoaded: 0",
    body: "checkShippedTiming (test/live-timing.test.ts)",
    message: /^the shipped announcer timing/,
    planted: () =>
      Promise.resolve().then(() => {
        checkShippedTiming({ ...announcerDefaults, delayLoaded: 0 }, firstTimingReturn());
      }),
    unplanted: shipped.unplanted,
  },
  {
    family: "shipped timing",
    plant: "the timing in force not started from the constant (a first return other than the constant)",
    body: "checkShippedTiming (test/live-timing.test.ts)",
    message: /^the shipped announcer timing/,
    planted: () =>
      Promise.resolve().then(() => {
        checkShippedTiming(announcerDefaults, { delayLoaded: 50, delayLoading: 50, hold: 500 });
      }),
    unplanted: shipped.unplanted,
  },
  {
    family: "capture bounds",
    plant: "an element that mutates its own attribute in a loop",
    body: "a capture over the container (in process)",
    message: /^capture exceeded /,
    planted: () => bounds(driver, loopMarkup),
    unplanted: () => bounds(driver, plainRegion),
  },
];

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await driver.readyState(null);
  await driver.mount("");
});

describe("plants (elements-timing project)", { timeout: 30_000 }, () => {
  it.each(rows)("$family: $plant turns $body red", async ({ planted, unplanted, message }) => {
    await expect(planted()).rejects.toThrow(message);
    await expect(unplanted()).resolves.not.toEqual([]);
  });
});
