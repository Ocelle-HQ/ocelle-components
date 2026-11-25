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
// measurements; the wide tables' scrollable-region-focusable is gone with their tabindex="0" (T057). Mission 019's
// plan.md § Complexity Tracking adds the data table's 74 rows (019 phase 1, operator decision (a) at the stop T022).
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

const clippedLine = "clipped line of the code block's scroll box (`elmPartiallyObscured`)";

/**
 * The 46 excepted notes, in run order (stories in index order, each in light then dark): the Prose document's ten
 * (plan.md § Complexity Tracking, axe exceptions under FR-029), then since 020 phase 2 (T028; operator decision on T021a,
 * specs/020-disclosure-code-block/plan.md § Complexity Tracking) one per clipped node of each overflowing scroll code-block
 * story and theme (36), in the stories file's order.
 */
const proseAndCodeBlock: readonly string[] = [
  ...(["light", "dark"] as const).flatMap((theme) =>
    [
      ["table:nth-child(12) > thead > tr > th:nth-child(12)", wide],
      ["table:nth-child(12) > tbody > tr:nth-child(1) > td:nth-child(12)", wide],
      ["tr:nth-child(2) > td:nth-child(12)", wide],
      ["table:nth-child(14) > thead > tr > th:nth-child(12)", linked],
      ["table:nth-child(14) > tbody > tr > td:nth-child(12)", linked],
    ].map(([selector, reason]) => `note: base-styles--prose-document/${theme}: color-contrast-incomplete: serious: ${String(selector)} excepted (${String(reason)})`),
  ),
  ...["scroll-overflowing", "scroll-middle", "scroll-end", "scroll-focused", "digest-scroll", "right-to-left-scroll", "scroll-unlabelled"].flatMap((story) =>
    (["light", "dark"] as const).flatMap((theme) =>
      // DigestScroll: one node per digest group the scroll box clips (operator decision,
      // specs/020-disclosure-code-block/reviews/phase-2/operator-digest-axe-decision.md).
      (story === "digest-scroll" ? Array.from({ length: 12 }, (_, index) => `.group:nth-child(${String(11 + 2 * index)})`) : [".code"]).map(
        (selector) => `note: elements-ocelle-code-block--${story}/${theme}: color-contrast-incomplete: serious: ocelle-code-block >>> ${selector} excepted (${clippedLine})`,
      ),
    ),
  ),
];

/**
 * The twelve excepted notes of the scrolling listbox story (014 plan.md § Complexity Tracking, FR-051, operator decision
 * 2026-11-14 option (a)): the options the list part's `overflow: auto` box clips, in run order, after the Prose
 * document's and the code-block stories' (`excepted`).
 */
const clipped = "option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`)";
const listboxExcepted: readonly string[] = (["light", "dark"] as const).flatMap((theme) =>
  ["epsilon", "zeta", "eta", "theta", "iota", "kappa"].map(
    (value) => `note: elements-ocelle-listbox--scrolling-listbox/${theme}: color-contrast-incomplete: serious: ocelle-option[value="${value}"] >>> .label excepted (${clipped})`,
  ),
);

const inlineEnd = "cell partly clipped at the inline end of the overflowing data table's scroll box (`elmPartiallyObscured`)";
const blockEnd = "cell partly clipped at the block end of the bounded data table's scroll box (`elmPartiallyObscured`)";
const emptyBody = "header cells of a table with an empty `<tbody>` (spec edge case), so axe cannot decide which data cells they name";
const body = "ocelle-data-table > table > tbody >";
/** The second column of the four rows an overflowing data table story partly clips at its inline end. */
const inlineCells = [`${body} tr:nth-child(1) > td:nth-child(2)`, `${body} tr:nth-child(2) > td:nth-child(2)`, `${body} tr:nth-child(3) > td:nth-child(2)`, "tr:nth-child(4) > td:nth-child(2)"];
/** The data table's stories with excepted nodes (019 plan.md § Complexity Tracking, axe exceptions under FR-029), in run order. */
const tables: readonly (readonly [story: string, rule: string, reason: string, selectors: readonly string[]])[] = [
  ["overflows-named-by-label", "color-contrast-incomplete", inlineEnd, inlineCells],
  ["overflows-named-by-caption", "color-contrast-incomplete", inlineEnd, inlineCells],
  ["overflows-unnamed", "color-contrast-incomplete", inlineEnd, inlineCells],
  ["overflows-named-by-host-aria-label", "color-contrast-incomplete", inlineEnd, inlineCells],
  ["overflows-blank-host-aria-label", "color-contrast-incomplete", inlineEnd, inlineCells],
  ["right-to-left", "color-contrast-incomplete", inlineEnd, inlineCells],
  ["empty-body", "th-has-data-cells-incomplete", emptyBody, ["ocelle-data-table > table"]],
  ["width-320", "color-contrast-incomplete", inlineEnd, inlineCells],
  ["sticky-header-bounded", "color-contrast-incomplete", blockEnd, [1, 2, 3, 4].map((column) => `tr:nth-child(10) > td:nth-child(${String(column)})`)],
  ["sticky-header-room-rule", "color-contrast-incomplete", blockEnd, [1, 2, 3, 4].map((column) => `${body} tr:nth-child(3) > td:nth-child(${String(column)})`)],
];
/** The 74 excepted notes of the data table's stories, each story in both themes. */
const dataTable: readonly string[] = tables.flatMap(([story, rule, reason, selectors]) =>
  (["light", "dark"] as const).flatMap((theme) => selectors.map((selector) => `note: elements-ocelle-data-table--${story}/${theme}: ${rule}: serious: ${selector} excepted (${reason})`)),
);
/** Every excepted note, in run order. */
const excepted: readonly string[] = [...proseAndCodeBlock, ...dataTable, ...listboxExcepted];

describe("axe gate (gates/bin/axe.ts)", () => {
  it(
    "audits the repository's 784 story-themes and exits 0, the Prose document's ten, the overflowing code-block stories' thirty-six, the scrolling listbox story's twelve and the data table stories' seventy-four color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029; 014 FR-051)",
    async () => {
      const at = await root("repository");
      const ran = await gate(at);
      expect(ran).toEqual({ code: 0, stdout: ["axe: 784 story-theme runs, 0 serious or critical; 132 notes (0 incomplete, 132 excepted)"], stderr: excepted });
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
        stdout: ["unlabelled--button/light: axe: button-name: critical: #plant-unlabelled", "unlabelled--button/dark: axe: button-name: critical: #plant-unlabelled", "axe: 2 findings in 786 story-theme runs"],
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
