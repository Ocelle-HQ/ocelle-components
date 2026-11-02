// The unit-tests gate and `pnpm test` (research.md R-03). Scaffold: signatures only.
import type { Io } from "../lib/cli.ts";

/** What the Chromium check reads: the override, Playwright's own executable path, and a file test. */
export interface ChromiumLookup {
  readonly override: string | undefined;
  readonly playwrightPath: string | undefined;
  readonly exists: (path: string) => boolean;
}

/** The executable the elements project will launch, and the problem when it is missing. */
export interface ChromiumCheck {
  readonly executable: string | undefined;
  readonly problem: string | undefined;
}

export function chromiumCheck(_lookup: ChromiumLookup): ChromiumCheck {
  return { executable: undefined, problem: undefined };
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
