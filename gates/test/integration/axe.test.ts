import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildRepoTree } from "../../lib/plant-repo.ts";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";
import type { Ran } from "./workspace.ts";

// The accessibility gate end to end (FR-013 to FR-016, FR-029; US3 scenarios 1, 2, 5 and 9; contracts/gates.md § `axe`;
// research.md R-08), on roots built by gates/lib/plant-repo.ts from the repository's configuration set and its
// exception entries (delta.json `exceptions: "repository"`, research.md R-16). axe runs in the host browser
// (OCELLE_CHROMIUM_PATH locally, Playwright's Chromium in CI). Expected lines are written from plan.md § Complexity
// Tracking (the ten FR-029 rows of the Prose document, operator decision on the phase 1 spike § 7) and the spike's
// measurements; the wide tables' scrollable-region-focusable is gone with their tabindex="0" (T057).
const timeout = 600_000;
const fixtures = join(repo, "gates/test/fixtures/axe");

afterEach(cleanUp);

/** This process's environment without Vitest's variables, CI and GITHUB_ACTIONS. */
function env(extra: Record<string, string> = {}): Record<string, string> {
  const removed = new Set(["CI", "GITHUB_ACTIONS"]);
  return { ...Object.fromEntries(Object.entries(baseEnv()).filter(([key]) => !removed.has(key))), ...extra };
}

/** A root of the repository's configuration set with a fixture's tree/ and delta.json. */
async function root(fixture: string): Promise<string> {
  const into = tempDir("axe");
  await buildRepoTree(repo, join(fixtures, fixture), into);
  return into;
}

function gate(at: string, extra: Record<string, string> = {}): Promise<Ran> {
  return runGate("gates/bin/axe.ts", ["--root", at], { cwd: tempDir("cwd"), env: env(extra) });
}

const wide = "clipped column of the wide table's scroll box (`elmPartiallyObscured`)";
const linked = "clipped column of the linked wide table's scroll box (`elmPartiallyObscured`)";

/** The ten excepted notes of the Prose document (plan.md § Complexity Tracking, axe exceptions under FR-029), in run order. */
const excepted: readonly string[] = (["light", "dark"] as const).flatMap((theme) =>
  [
    ["table:nth-child(12) > thead > tr > th:nth-child(12)", wide],
    ["table:nth-child(12) > tbody > tr:nth-child(1) > td:nth-child(12)", wide],
    ["tr:nth-child(2) > td:nth-child(12)", wide],
    ["table:nth-child(14) > thead > tr > th:nth-child(12)", linked],
    ["table:nth-child(14) > tbody > tr > td:nth-child(12)", linked],
  ].map(([selector, reason]) => `note: base-styles--prose-document/${theme}: color-contrast-incomplete: serious: ${String(selector)} excepted (${String(reason)})`),
);

describe("axe gate (gates/bin/axe.ts)", () => {
  it(
    "audits the repository's 346 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)",
    async () => {
      const at = await root("repository");
      const ran = await gate(at);
      expect(ran).toEqual({ code: 0, stdout: ["axe: 346 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)"], stderr: excepted });
    },
    timeout,
  );

  it(
    "fails a story with an unlabelled button in both themes, one critical button-name finding each, naming its selector (US3 scenario 2)",
    async () => {
      const at = await root("unlabelled-button");
      const ran = await gate(at);
      expect(ran).toEqual({
        code: 1,
        stdout: ["unlabelled--button/light: axe: button-name: critical: #plant-unlabelled", "unlabelled--button/dark: axe: button-name: critical: #plant-unlabelled", "axe: 2 findings in 348 story-theme runs"],
        stderr: excepted,
      });
    },
    timeout,
  );

  it(
    "exits 2 naming the malformed exceptions file before it builds anything",
    async () => {
      const at = await root("bad-exceptions");
      const ran = await gate(at);
      expect(ran).toEqual({ code: 2, stdout: [], stderr: ["axe: could not run: storybook/a11y-exceptions.json#0: reason must be a non-empty string"] });
      expect(existsSync(join(at, "storybook/dist"))).toBe(false);
    },
    timeout,
  );

  it(
    "exits 2 naming the browser when OCELLE_CHROMIUM_PATH names no executable",
    async () => {
      const at = await root("repository");
      const ran = await gate(at, { OCELLE_CHROMIUM_PATH: join(tempDir("none"), "chrome") });
      expect({ code: ran.code, stdout: ran.stdout, lines: ran.stderr.length }).toEqual({ code: 2, stdout: [], lines: 1 });
      expect(ran.stderr[0]).toMatch(/^axe: could not run: no browser: /);
    },
    timeout,
  );
});
