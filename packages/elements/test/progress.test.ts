import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-progress.ts";
import { inProcessDriver } from "./in-process.ts";
import { progressScenarios } from "./scenarios/progress.ts";

// User Story 3's browser scenarios, `ocelle-progress`, in process on the element source (013 contracts/checks.md
// § Scenario bodies; tasks.md T040): the shared bodies of scenarios/progress.ts on the in-process driver, which Stryker
// mutates. Every body starts at a 1280 × 800 viewport, without forced colours or reduced motion (both reset after each
// body, contracts/checks.md § Driver additions), and its mount starts a fresh loading episode. The bodies that wait for
// the 4.2 s sweep window take up to about 6 s. The same bodies run on the built browser build on the strict-CSP fixture
// in test/browser/progress.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("ocelle-progress, in process (US3)", { timeout: 30_000 }, () => {
  it.each(progressScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

describe("a bar changed out of the document, in process (013 R-06 membership)", { timeout: 30_000 }, () => {
  it("a bar removed after its sweep and made indeterminate again while out of the document does not keep the episode open: a bar inserted two frames later sweeps from its own start", async () => {
    await driver.mount('<div id="region"><ocelle-progress id="first" value="40" label="Copying"></ocelle-progress></div>');
    const first = document.getElementById("first") as HTMLElement & { value: number | undefined; updateComplete: Promise<unknown> };
    first.value = undefined;
    await first.updateComplete;
    await driver.frames(2);
    const started = (await driver.animations("first")).some((each) => each.playState === "running");
    await new Promise((resolve) => setTimeout(resolve, 4600));
    first.remove();
    first.value = 50;
    await first.updateComplete;
    first.value = undefined;
    await first.updateComplete;
    await driver.frames(2);
    document.getElementById("region")?.insertAdjacentHTML("beforeend", '<ocelle-progress id="second" label="Loading"></ocelle-progress>');
    await (document.getElementById("second") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    await driver.frames(1);
    const running = (await driver.animations("second")).find((each) => each.playState === "running");
    expect({ started, running: running !== undefined, fresh: running?.currentTime !== null && running?.currentTime !== undefined && running.currentTime < 1400 }).toEqual({ started: true, running: true, fresh: true });
  });
});
