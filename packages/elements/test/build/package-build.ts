// The package build of the elements-build tests (005 research.md R-05, R-11): `pnpm run build` in packages/elements,
// as a host's install of the package would find it, so the tests read what `pnpm pack` publishes. The project runs its
// files one at a time (vitest.config.ts), so two builds never write dist/ at once.
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export const elements = fileURLToPath(new URL("../..", import.meta.url));
export const run = promisify(execFile);

/** Runs the package's build script; rejects with its output when it fails. */
export async function buildPackage(): Promise<void> {
  await run("pnpm", ["run", "build"], { cwd: elements, maxBuffer: 16 * 1024 * 1024 });
}
