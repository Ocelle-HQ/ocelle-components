// The accessibility gate (contracts/gates.md § `axe`).
// Entry stub (specs/006-storybook-workbench tasks.md T003): it exits 2 "not implemented" until phase 4 implements it.
import type { Browser } from "playwright";
import { main } from "../lib/cli.ts";
import type { Outcome } from "../lib/axe-verdict.ts";
import type { Theme } from "../lib/visual-verdict.ts";

/** What every story-theme's audit shares: the server's origin, the built dist/, axe-core's script and the rule options. */
export interface AuditSetup {
  readonly origin: string;
  readonly dist: string;
  readonly axePath: string;
  readonly rules: Readonly<Record<string, { readonly enabled: boolean }>>;
}

/** One story-theme in a fresh browser context: its outcome (render failure, the checks, axe's results). */
export function auditStoryTheme(browser: Pick<Browser, "newContext">, setup: AuditSetup, story: string, theme: Theme): Promise<Outcome> {
  return Promise.reject(new Error(`not implemented (axe, phase 4): ${setup.origin} ${story} ${theme} ${typeof browser}`));
}

/** Not implemented yet: the entry wrapper turns the error into exit 2 with one line naming it. */
export function run(): number {
  throw new Error("not implemented (axe, phase 4)");
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/entry-stubs.test.ts "axe exits 2 with exactly could not run: not implemented (axe, phase 4)"
if (import.meta.main) await main(run);
