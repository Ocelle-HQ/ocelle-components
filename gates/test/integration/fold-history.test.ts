import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

// Op 021 (#51, plan.md *Test approach*): the fold signs what it rebuilds when commit.gpgsign is on. ssh-keygen is not
// installed here, so git signs through a throwaway program (gpg.ssh.program) that writes a fixed SSH signature block
// to <buffer>.sig, as `ssh-keygen -Y sign` does. The fold checks the gpgsig header, which git writes from whatever the
// program returns. Variants: one that always fails, and one that fails only on the remap commit's buffer.
type Signer = "ok" | "fail" | "failOnRemap";
const signerScripts: Record<Signer, string> = {
  ok: "",
  fail: "exit 1\n",
  failOnRemap: 'grep -q "remap evidence SHAs" "$buffer" && exit 1\n',
};

interface SignedRepo {
  readonly root: string;
  readonly env: Record<string, string>;
  readonly git: (...args: string[]) => string;
  readonly foldBase: string;
  readonly unkept: string;
  readonly phaseBase: string;
  readonly red: string;
  readonly tools: string;
}

/** A temporary repository whose fold rewrites the phase base, with signing on; `signer` is set after the setup commits. */
function signedRepo(signer: Signer): SignedRepo {
  const root = tempDir("fold-signed");
  const tools = tempDir("fold-tools");
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
  for (const [name, check] of Object.entries(signerScripts)) {
    const script = [
      "#!/usr/bin/env bash",
      'buffer="${@: -1}"',
      check,
      'printf -- "-----BEGIN SSH SIGNATURE-----\\nU1NIU0lHdGVzdA==\\n-----END SSH SIGNATURE-----\\n" > "$buffer.sig"',
      "",
    ].join("\n");
    writeFileSync(join(tools, `signer-${name}`), script);
    chmodSync(join(tools, `signer-${name}`), 0o755);
  }
  writeFileSync(join(tools, "key"), "a throwaway signing key file\n");
  git("init", "-q", "-b", "work");
  git("config", "user.name", "T");
  git("config", "user.email", "t@example.invalid");
  git("config", "gpg.format", "ssh");
  git("config", "user.signingkey", join(tools, "key"));
  git("config", "gpg.ssh.program", join(tools, "signer-ok"));
  git("config", "commit.gpgsign", "true");
  const foldBase = commit("a.txt", "a\n", "chore: start");
  const unkept = commit("b.txt", "b\n", "chore: an unkept commit before the phase base");
  const phaseBase = commit("c.txt", "c\n", "docs: the phase base");
  const red = commit("a.test.ts", "red\n", "test: phase 1 red");
  write(`${reviews}/base.sha`, `${phaseBase}\n`);
  write(`${reviews}/red-commits`, `phase ${red}\n`);
  commit("a.ts", "green\n", "feat: phase 1 green");
  git("config", "gpg.ssh.program", join(tools, `signer-${signer}`));
  return { root, env, git, foldBase, unkept, phaseBase, red, tools };
}

/** A `git` that drops every -S argument of commit-tree and adds --no-gpg-sign, so the rebuilt commits are unsigned. */
function unsigningGit(tools: string): string {
  const dir = join(tools, "bin");
  mkdirSync(dir);
  const real = execFileSync("bash", ["-c", "command -v git"], { encoding: "utf8" }).trim();
  const script = [
    "#!/usr/bin/env bash",
    `real=${JSON.stringify(real)}`,
    'for a in "$@"; do [[ "$a" == commit-tree ]] && tree=1; done',
    'if [[ -z "${tree:-}" ]]; then exec "$real" "$@"; fi',
    'args=(); for a in "$@"; do [[ "$a" == -S* ]] && continue; args+=("$a"); [[ "$a" == commit-tree ]] && args+=(--no-gpg-sign); done',
    'exec "$real" "${args[@]}"',
    "",
  ].join("\n");
  writeFileSync(join(dir, "git"), script);
  chmodSync(join(dir, "git"), 0o755);
  return dir;
}

interface FoldRun {
  readonly status: number | null;
  readonly ok: boolean | undefined;
  readonly problems: readonly string[];
}

/** Runs the fold from `foldBase` with the label phase-1; the output is parsed when it is JSON. */
function runFold(r: SignedRepo, path?: string): FoldRun {
  const env = path === undefined ? r.env : { ...r.env, PATH: `${path}:${r.env.PATH ?? ""}` };
  const ran = spawnSync("bash", [fold, r.foldBase, feature, "phase-1"], { cwd: r.root, env, encoding: "utf8" });
  let parsed: { ok?: boolean; problems?: string[] };
  try {
    parsed = JSON.parse(ran.stdout) as { ok?: boolean; problems?: string[] };
  } catch {
    parsed = {};
  }
  return { status: ran.status, ok: parsed.ok, problems: parsed.problems ?? [] };
}

/** Whether a commit carries a signature header. */
function signed(r: SignedRepo, sha: string): boolean {
  return /^gpgsig(-sha256)? /m.test(r.git("cat-file", "commit", sha));
}

/** HEAD, the evidence files and every ref of the repository. */
function state(r: SignedRepo): { head: string; baseSha: string; redCommits: string; refs: string } {
  return {
    head: r.git("rev-parse", "HEAD"),
    baseSha: readFileSync(join(r.root, `${reviews}/base.sha`), "utf8"),
    redCommits: readFileSync(join(r.root, `${reviews}/red-commits`), "utf8"),
    refs: r.git("for-each-ref", "--format=%(refname) %(objectname)"),
  };
}

function prefold(r: SignedRepo): string {
  return r.git("for-each-ref", "--format=%(refname)", "refs/ocelle/prefold");
}

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

  it(
    "signs every commit of the folded range, the rebuilt ones and the remap commit, when commit.gpgsign is on (op 021, scenario 1)",
    () => {
      const r = signedRepo("ok");
      const ran = runFold(r);
      const newBase = readFileSync(join(r.root, `${reviews}/base.sha`), "utf8").trim();
      const range = r.git("rev-list", `${r.foldBase}..HEAD`).split("\n");
      expect({
        status: ran.status,
        ok: ran.ok,
        rewritten: newBase !== r.phaseBase,
        commits: range.length,
        unsigned: range.filter((sha) => !signed(r, sha)),
      }).toEqual({ status: 0, ok: true, rewritten: true, commits: 4, unsigned: [] });
    },
    timeout,
  );

  it(
    "refuses an unsigned rebuild with exit 1 and an is-not-signed problem, and changes nothing (op 021, scenario 2)",
    () => {
      const r = signedRepo("ok");
      const before = state(r);
      const ran = runFold(r, unsigningGit(r.tools));
      expect({
        status: ran.status,
        ok: ran.ok,
        notSigned: ran.problems.some((p) => /^folded commit [0-9a-f]{40} is not signed$/.test(p)),
        state: state(r),
        prefold: prefold(r),
      }).toEqual({ status: 1, ok: false, notSigned: true, state: before, prefold: "" });
    },
    timeout,
  );

  it(
    "ends with exit 2 and ok:false JSON when signing fails while rebuilding, and changes nothing (op 021, scenario 3)",
    () => {
      const r = signedRepo("fail");
      const before = state(r);
      const ran = runFold(r);
      expect({ status: ran.status, ok: ran.ok, state: state(r), prefold: prefold(r) }).toEqual({
        status: 2,
        ok: false,
        state: before,
        prefold: "",
      });
    },
    timeout,
  );

  it(
    "rolls back to the old head with exit 1 and no prefold ref when the remap commit cannot be signed (op 021, scenario 4)",
    () => {
      const r = signedRepo("failOnRemap");
      const before = state(r);
      const ran = runFold(r);
      expect({ status: ran.status, ok: ran.ok, state: state(r), prefold: prefold(r) }).toEqual({
        status: 1,
        ok: false,
        state: before,
        prefold: "",
      });
    },
    timeout,
  );

  it(
    "refuses with exit 2 a range that holds a commit reachable from main, and changes nothing (op 021, scenario 5)",
    () => {
      const r = signedRepo("ok");
      r.git("branch", "main", r.unkept);
      const before = state(r);
      const ran = runFold(r);
      expect({
        status: ran.status,
        ok: ran.ok,
        onMain: ran.problems.some((p) => p.includes("on main")),
        state: state(r),
        prefold: prefold(r),
      }).toEqual({ status: 2, ok: false, onMain: true, state: before, prefold: "" });
    },
    timeout,
  );
});
