import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, tempDir } from "./workspace.ts";

// Op 016, operator round 3 of phase 1 (O3-04; spec.md OR-008 and scenario 17, plan.md *The history fold*): the
// evidence-preserving history fold, tooling/speckit/bin/fold-history.sh, run on a temporary git repository. Its one
// phase has a base commit with an unkept commit before it, so a fold from before both rewrites that base: the
// `- base:` line of the phase's plants.md must then name the new commit, as base.sha does, and no other line changes.
const timeout = 60_000;
const fold = join(repo, "tooling/speckit/bin/fold-history.sh");
const feature = "ops/900-fold";
const reviews = `${feature}/reviews/phase-1`;

afterEach(cleanUp);

describe("history fold (tooling/speckit/bin/fold-history.sh)", () => {
  it(
    "remaps the base SHA on the - base: line of a phase's plants.md with base.sha, and changes no other line of it",
    () => {
      const root = tempDir("fold");
      const env = { ...baseEnv(), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
      const git = (...args: string[]): string => execFileSync("git", args, { cwd: root, env, encoding: "utf8" }).trim();
      const write = (path: string, text: string): void => {
        mkdirSync(dirname(join(root, path)), { recursive: true });
        writeFileSync(join(root, path), text);
      };
      const commit = (path: string, text: string, message: string): string => {
        write(path, text);
        git("add", "-A");
        git("commit", "-q", "-s", "-m", message);
        return git("rev-parse", "HEAD");
      };
      git("init", "-q", "-b", "work");
      git("config", "user.name", "T");
      git("config", "user.email", "t@example.invalid");
      git("config", "commit.gpgsign", "false");
      const foldBase = commit("a.txt", "a\n", "chore: start");
      commit("b.txt", "b\n", "chore: an unkept commit before the phase base");
      const phaseBase = commit("c.txt", "c\n", "docs: the phase base");
      const red = commit("a.test.ts", "red\n", "test: phase 1 red");
      const plants = [
        "# Plants of phase 1",
        "",
        `- base: ${phaseBase}`,
        `- command: pnpm run gate:plants -- --affected ${phaseBase}`,
        "- exit: 0",
        "",
        "```text",
        `$ node gates/bin/plants.ts -- --affected ${phaseBase}`,
        "note: affected: lint/pass-a, by gates/bin/lint.ts",
        `plants: affected since ${phaseBase}: 1 of 2 plants judged, every plant as expected; not the Plants check`,
        "```",
        "",
      ];
      write(`${reviews}/base.sha`, `${phaseBase}\n`);
      write(`${reviews}/red-commits`, `phase ${red}\n`);
      write(`${reviews}/plants.md`, plants.join("\n"));
      commit("a.ts", "green\n", "feat: phase 1 green");

      const ran = JSON.parse(execFileSync("bash", [fold, foldBase, feature, "phase-1"], { cwd: root, env, encoding: "utf8" })) as { ok: boolean };
      const newBase = readFileSync(join(root, `${reviews}/base.sha`), "utf8").trim();
      expect({
        ok: ran.ok,
        rewritten: newBase !== phaseBase,
        sameTree: git("rev-parse", `${newBase}^{tree}`) === git("rev-parse", `${phaseBase}^{tree}`),
        plants: readFileSync(join(root, `${reviews}/plants.md`), "utf8").split("\n"),
      }).toEqual({ ok: true, rewritten: true, sameTree: true, plants: plants.map((line, index) => (index === 2 ? `- base: ${newBase}` : line)) });
    },
    timeout,
  );
});
