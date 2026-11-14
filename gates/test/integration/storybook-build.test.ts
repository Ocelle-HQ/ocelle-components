import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildRepoTree } from "../../lib/plant-repo.ts";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";
import type { Ran } from "./workspace.ts";

// The Storybook build gate end to end (FR-001, FR-002, FR-017, US1 scenarios 1, 2 and 5; contracts/gates.md
// § `storybook-build`; research.md R-09, R-16): `gates/bin/storybook-build.ts --root <plant root>` from another
// working directory, on plant roots built by gates/lib/plant-repo.ts as the plant job builds them: the repository's
// stories (exit 0 with the story count), a story file with a syntax error (exit 1, one finding at the file), and a
// root without storybook/node_modules (exit 2 from the CLI check: without it pnpm would reinstall the dependencies
// and the build pass, spike § 1). A build in a plant root writes nothing below the repository's root node_modules or
// storybook/node_modules (path, size and modification time of every entry, before and after, as spike § 4 listed
// them): pnpm's dependency check before `run` is off in the build command (operator decision on the spike § 4). A root
// whose storybook/.storybook/main.ts Storybook cannot evaluate exits 2 (operator round reviews/phase-2/round-2.md O2-02).
const timeout = 300_000;
const empty = join(repo, "gates/test/fixtures/plant-repo/empty-plant");
const roots = join(repo, "gates/test/fixtures/storybook-build-roots");

afterEach(cleanUp);

/**
 * The caches the test run's own Vitest and Vite processes write below the repository's root node_modules while this
 * test runs (other test files start them in workspaces that link it): never the build's, whose Vite cache is the root's
 * storybook/.cache/vite (main.ts) and whose default would be below storybook/node_modules, listed in full.
 */
const testRunCaches = [".vitest-cache", ".vite", ".vite-temp"].map((name) => join(repo, "node_modules", name));

/** Every entry below `dir` (symbolic links not followed) as `path size mtime`, sorted; but the test run's caches. */
function listing(dir: string): string[] {
  const inCache = (path: string): boolean => testRunCaches.some((cache) => path === cache || path.startsWith(`${cache}/`));
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => !inCache(path))
    .map((path) => {
      const stat = lstatSync(path);
      return `${relative(repo, path)} ${String(stat.size)} ${String(stat.mtimeMs)}`;
    })
    .sort();
}

function gate(root: string): Promise<Ran> {
  return runGate("gates/bin/storybook-build.ts", ["--root", root], { cwd: tempDir("cwd"), env: baseEnv() });
}

describe("storybook-build gate (gates/bin/storybook-build.ts)", () => {
  it(
    "builds the repository's stories in a plant root, exits 0 with the story count, and leaves the repository's node_modules and storybook/node_modules unchanged",
    async () => {
      const before = { root: listing(join(repo, "node_modules")), storybook: listing(join(repo, "storybook/node_modules")) };
      const root = tempDir("storybook-build");
      await buildRepoTree(repo, empty, root);
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({ code: 0, stdout: ["storybook-build: built 36 stories"], stderr: [] });
      expect(before.root.length).toBeGreaterThan(1000);
      expect(before.storybook.length).toBeGreaterThan(3);
      const after = { root: listing(join(repo, "node_modules")), storybook: listing(join(repo, "storybook/node_modules")) };
      expect(after.storybook).toEqual(before.storybook);
      expect(after.root).toEqual(before.root);
      // The rewrite the spike saw (§ 4) put the plant root's path into the repository's .bin shims.
      const shims = [join(repo, "node_modules/.bin"), join(repo, "storybook/node_modules/.bin")].flatMap((dir) => readdirSync(dir).map((name) => join(dir, name)));
      expect(shims.length).toBeGreaterThan(10);
      expect(shims.filter((shim) => readFileSync(shim, "utf8").includes(root))).toEqual([]);
    },
    timeout,
  );

  // CI runs 43056264356 and 43064614842 (PR #24): Storybook's logger draws ASCII line marks under TERM=linux and
  // Unicode ones otherwise (TERM unset on the GitHub runner); the gate gives the same finding under both.
  it.each([
    ["TERM=linux", { TERM: "linux" }],
    ["TERM unset", { TERM: undefined }],
  ] as const)(
    "exits 1 with one finding at a story file with a syntax error (%s)",
    async (_, term) => {
      const root = tempDir("storybook-build");
      await buildRepoTree(repo, join(roots, "syntax-error"), root);
      const merged: Record<string, string | undefined> = { ...baseEnv(), ...term };
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(merged)) if (value !== undefined) env[key] = value;
      const ran = await runGate("gates/bin/storybook-build.ts", ["--root", root], { cwd: tempDir("cwd"), env });
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 1,
        stdout: ["storybook/stories/broken.stories.ts: storybook-build: build-error: SyntaxError: Unexpected token (4:49)", "storybook-build: 1 finding in 1 file"],
        stderr: [],
      });
    },
    timeout,
  );

  // Operator round reviews/phase-2/round-2.md O2-02 (landing L1-03, FR-001, operator choice (a)).
  it(
    "exits 2 and prints no finding when Storybook cannot evaluate storybook/.storybook/main.ts",
    async () => {
      const root = tempDir("storybook-build");
      await buildRepoTree(repo, join(roots, "config-unreadable"), root);
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: ["storybook-build: could not run: storybook/.storybook/main.ts cannot be evaluated (SB_CORE-SERVER_0007 (MainFileEvaluationError): Storybook couldn't)"],
      });
    },
    timeout,
  );

  it(
    "exits 2 naming the missing tool and pnpm install when storybook/node_modules is not installed, from the CLI check",
    async () => {
      const root = tempDir("storybook-build");
      await buildRepoTree(repo, empty, root, { expect: "error", why: "w", cause: "c", unlinked: ["storybook/node_modules"] });
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: ["storybook-build: could not run: storybook is not installed; run pnpm install"],
      });
    },
    timeout,
  );
});
