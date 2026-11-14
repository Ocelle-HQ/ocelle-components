import { afterEach, describe, expect, it } from "vitest";
import { loopMarkup } from "./fixtures/live-loop.ts";
import { plainRegion } from "./fixtures/live-regions.ts";
import { imgDescendants, linkName, noKeepingRule } from "./fixtures/reading-plants.ts";
import { inProcessDriver } from "./in-process.ts";
import { announcements, regionText } from "./live-reading.ts";
import { caseNamed } from "./live-rules.ts";
import type { Driver } from "./scenarios/driver.ts";

// The plant rows of the elements project (specs/010-feedback-forms contracts/testing.md § Plants; T001c). A row names
// the family, the plant, the body it runs and the assertion message that body must fail with; it runs the body with the
// plant, which must reject with that message, and the same body without the plant, which must pass, so a plant that
// does not bite, or a body that fails on its own, fails the row. Phase 1's rows: the oracle reading (planted readings
// of test/fixtures/reading-plants.ts on the named cases of test/live-rules.ts) and the capture bounds in process (the
// looping element of test/fixtures/live-loop.ts). Rows that run under `liveCapture.startDocument` are in
// test/browser/plants.test.ts.
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
  await driver.mount("");
});

describe("plants (elements project)", { timeout: 30_000 }, () => {
  it.each(rows)("$family: $plant turns $body red", async ({ planted, unplanted, message }) => {
    await expect(planted()).rejects.toThrow(message);
    await expect(unplanted()).resolves.not.toEqual([]);
  });
});
