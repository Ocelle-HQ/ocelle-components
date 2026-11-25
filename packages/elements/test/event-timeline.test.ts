import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-event-timeline.ts";
import { inProcessDriver } from "./in-process.ts";
import { detachedTimelineTimeScenarios, eventTimelineScenarios } from "./scenarios/event-timeline.ts";

// `ocelle-event-timeline` and `ocelle-timeline-event`, in process on the element source (019 US2; contracts/checks.md
// § Harnesses; tasks.md T034): the shared bodies of scenarios/event-timeline.ts (T030 to T033) on the in-process driver,
// so Stryker's mutants of src/ocelle-event-timeline.ts, src/ocelle-timeline-event.ts and src/timeline-time.ts are
// killed by the real tree, layout and mutations. The same bodies run on the strict-CSP fixture with the browser build
// in test/browser/event-timeline.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
  await driver.theme(null);
});

describe("ocelle-event-timeline and ocelle-timeline-event, in process (US2)", () => {
  it.each(eventTimelineScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });

  it.each(detachedTimelineTimeScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
