// The accessibility gate (FR-013 to FR-016, FR-029; contracts/gates.md § `axe`; research.md R-08): `--root <dir>` is
// the root whose Storybook it builds and audits. It reads storybook/a11y-exceptions.json and the plans its entries name,
// builds the Storybook with the storybook-build gate's build function, serves dist/ on 127.0.0.1, and for each story of
// the built index in light and dark opens a fresh host-browser context with contextOptions(theme), waits for the render,
// applies the pointer state, runs the checks that stop axe (closed shadow roots, the pointer target, an empty root) and
// the outside-root check, then injects axe-core with page.addScriptTag and runs it on the story area with the FR-016
// rules. The decisions are gates/lib/axe-rules.ts, axe-verdict.ts, a11y-exceptions.ts, story-checks.ts and
// capture-plan.ts; this entry and the collectors of gates/lib/story-page.ts only run the browser and read files (the
// process boundary, tested by gates/test/integration/axe.test.ts, gates/test/axe-context.test.ts and the axe plants);
// the lookup of axe-core and the exit 2 when it is missing take injected tools, tested by gates/test/axe-gate.test.ts.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Browser } from "playwright";
import { exceptionsPath, parseExceptions, recordedIn } from "../lib/a11y-exceptions.ts";
import { axeContext, ruleMeta, ruleOptions } from "../lib/axe-rules.ts";
import type { AxeRule } from "../lib/axe-rules.ts";
import { axeVerdict, blocker } from "../lib/axe-verdict.ts";
import type { Audit, Outcome, Rendered } from "../lib/axe-verdict.ts";
import { contextOptions } from "../lib/capture-plan.ts";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import type { GateResult } from "../lib/findings.ts";
import { emptyRoot, outsideRoot } from "../lib/story-checks.ts";
import { applyPointer, bodyChildren, closedShadows, openStory, rootNodes, runAxe, scrollBack, settle, waitForRender } from "../lib/story-page.ts";
import { serve } from "../lib/storybook-serve.ts";
import { buildStories, gateRepository } from "../lib/visual-host.ts";
import { themes } from "../lib/visual-verdict.ts";
import type { Theme } from "../lib/visual-verdict.ts";

/** What every story-theme's audit shares: the server's origin, the built dist/, axe-core's script and the rule options. */
export interface AuditSetup {
  readonly origin: string;
  readonly dist: string;
  readonly axePath: string;
  readonly rules: Readonly<Record<string, { readonly enabled: boolean }>>;
}

/** One story-theme in a fresh browser context: its outcome (render failure, the checks, axe's results). */
export async function auditStoryTheme(browser: Pick<Browser, "newContext">, setup: AuditSetup, story: string, theme: Theme): Promise<Outcome> {
  const context = await browser.newContext(contextOptions(theme));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const work = async (): Promise<Outcome> => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    const { page } = await openStory(context, setup.origin, setup.dist, story, theme);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    const ready = await waitForRender(page);
    // Stryker disable next-line all: process boundary, covered by the axe plants fail-throws-on-load and fail-render-throws, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    if (!ready.ready) return { kind: ready.status, message: ready.message };
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    await scrollBack(page);
    // Stryker disable next-line all: process boundary, covered by the axe plants fail-pointer-target-below-fold, fail-hover-reveals-unlabelled and fail-hover-near-fold, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    const pointer = await applyPointer(page, theme);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    await settle(page);
    // Stryker disable next-line all: process boundary, covered by the axe plant fail-closed-shadow-root, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    const closed = await closedShadows(page);
    // Stryker disable next-line all: process boundary, covered by the axe plants fail-empty and fail-no-box, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    const empty = emptyRoot(await rootNodes(page));
    // Stryker disable next-line all: process boundary, covered by the axe plant fail-outside-root, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    const outside = outsideRoot(await bodyChildren(page));
    // Stryker disable next-line all: process boundary, covered by the axe plants fail-pointer-target-below-fold, fail-hover-reveals-unlabelled and fail-hover-near-fold, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    const rendered: Rendered = pointer === undefined ? { closed, empty, outside } : { closed, pointer, empty, outside };
    // Stryker disable next-line all: process boundary, covered by the axe plants fail-empty, fail-closed-shadow-root and fail-pointer-target-below-fold, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    if (blocker(rendered) !== undefined) return { kind: "rendered", ...rendered };
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    return { kind: "rendered", ...rendered, results: await runAxe(page, setup.axePath, axeContext(), setup.rules) };
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  return work().finally(() => context.close());
}

/** What the gate looks up and runs outside itself: axe-core in the gate repository's node_modules, and the build. */
export interface AxeTools {
  /** Resolves a module of the gate repository to its file (require.resolve); throws when it is not installed. */
  readonly resolve: (id: string) => string;
  /** Loads a module of the gate repository (require); throws when it is not installed. */
  readonly load: (id: string) => unknown;
  /** Builds the root's Storybook and reads its index (the storybook-build gate's build function). */
  readonly build: typeof buildStories;
}

/**
 * axe-core's script and the FR-016 rule options from its own metadata, or undefined when axe-core is not installed
 * (tested in process by gates/test/axe-gate.test.ts).
 */
export function axeCore(tools: AxeTools): { readonly path: string; readonly rules: AuditSetup["rules"] } | undefined {
  let path: string;
  let core: { readonly _audit: { readonly rules: readonly AxeRule[] } };
  try {
    path = tools.resolve("axe-core/axe.min.js");
    core = tools.load("axe-core") as typeof core;
  } catch {
    return undefined;
  }
  return { path, rules: ruleOptions(ruleMeta(core._audit.rules)) };
}

/** The gate repository's axe-core and the real build. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
function nodeTools(): AxeTools {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const require = createRequire(join(gateRepository, "package.json"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  return { resolve: (id) => require.resolve(id), load: (id): unknown => require(id), build: buildStories };
}

/** The gate on a root (contracts/gates.md § `axe`): exceptions, axe-core, the build, then every story-theme. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
export async function axe(root: string, env: Io["env"], note: (line: string) => void, tools: AxeTools = nodeTools()): Promise<GateResult> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const fail = (cause: string): GateResult => ({ exit: 2, cause: `axe: could not run: ${cause}` });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "exits 2 naming the malformed exceptions file before it builds anything"
  const entries = parseExceptions(await readFile(join(root, exceptionsPath), "utf8").catch(() => "[]"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "exits 2 naming the malformed exceptions file before it builds anything"
  if ("problem" in entries) return fail(entries.problem);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const states = await Promise.all(entries.map(async (entry) => recordedIn(entry, await readFile(join(root, entry.plan), "utf8").catch(() => undefined))));
  const core = axeCore(tools);
  if (core === undefined) return fail("axe-core not found; run pnpm install");
  // Stryker disable next-line all: process boundary, covered by the axe plant error-build-fails, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const stories = await tools.build(root, env);
  // Stryker disable next-line all: process boundary, covered by the axe plant error-build-fails, and by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  if ("cause" in stories) return fail(stories.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "exits 2 naming the browser when OCELLE_CHROMIUM_PATH names no executable"
  const executablePath = env.OCELLE_CHROMIUM_PATH;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "exits 2 naming the browser when OCELLE_CHROMIUM_PATH names no executable"
  const launched = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath }).catch((error: unknown) => (error instanceof Error ? error : new Error(String(error))));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "exits 2 naming the browser when OCELLE_CHROMIUM_PATH names no executable"
  if (launched instanceof Error) return fail(`no browser: ${launched.message.split("\n")[0] ?? ""}`);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const dist = join(root, "storybook/dist");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const server = await serve(dist);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const setup: AuditSetup = { origin: server.origin, dist, axePath: core.path, rules: core.rules };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const audits: Audit[] = [];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const work = async (): Promise<void> => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
    for (const story of stories.value) for (const theme of themes) audits.push({ story: story.id, theme, outcome: await auditStoryTheme(launched, setup, story.id, theme) });
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  await work().finally(() => Promise.all([launched.close(), server.close()]));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const verdict = axeVerdict(audits, states);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  for (const line of verdict.notes) note(line);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  return verdict.result;
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
  return emit(await axe(context.root, io.env, io.err), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/axe.test.ts "audits the repository's 42 story-themes and exits 0, the Prose document's ten color-contrast-incomplete nodes excepted and no other result (US3 scenarios 1 and 5, FR-029)"
if (import.meta.main) await main(run);
