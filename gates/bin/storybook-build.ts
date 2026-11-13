// The Storybook build gate (FR-001, FR-002, FR-017; contracts/gates.md § `storybook-build`; research.md R-09, R-16):
// `--root <dir>` is the root whose Storybook workspace it builds, with the workspace's own build script. The decisions
// (the CLI check, the build command and environment, the verdict on the output and the index) are
// gates/lib/storybook-build.ts; this entry only hands them the root's files and pnpm (the process boundary, tested by
// gates/test/integration/storybook-build.test.ts).
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";
import { storybookBuild } from "../lib/storybook-build.ts";
import type { BuildTools } from "../lib/storybook-build.ts";

/** The files and processes of the root at `root`. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged"
function tools(root: string): BuildTools {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged"
  return {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged"
    read: (path) => readFile(join(root, path), "utf8").catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "exits 2 naming the missing tool and pnpm install when storybook/node_modules is not installed, from the CLI check"
    exists: (path) => access(join(root, path)).then(() => true, () => false),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "exits 1 with one finding at a story file with a syntax error"
    run: (command, args, env) => runTool(command, args, root, env),
  };
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged"
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged"
  return emit(await storybookBuild(context.root, io.env, tools(context.root)), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/storybook-build.test.ts "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged"
if (import.meta.main) await main(run);
