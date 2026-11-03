# Data Model: Repository Foundation (001)

## Gate (registry entry in `gates/gates.json`)

| Field | Type | Rule |
|---|---|---|
| `id` | string | kebab-case, unique; also the `pnpm run gate:<id>` script and the plants directory name |
| `check` | string | the CI check name shown on pull requests (contracts/ci-checks.md) |
| `command` | string | the command a normal run executes |
| `plantCommand` | string | the command run per plant, with `{plant}` replaced by the plant directory (or `{root}` by the temporary repository built from it) |
| `plantForm` | enum | `repo-tree`, `commit-repo`, `mutation-repo` (each run in a temporary repository, the gate in normal mode with `--root`) or `workspace` (pins); contracts/plants.md |
| `scope` | string | the files it checks, as in spec FR-028 |
| `helperJobs` | string[] | optional; job ids in `ci.yml` that serve this gate and are not gates themselves (`mutation-plan`, `mutation-shard` for `mutation`, research.md R-08) |

Validation: the set of gate ids equals the set of gate jobs in `.github/workflows/ci.yml` (the plant job and every
`helperJobs` id excluded) and the FR-020 list in `gates/lib/registry.ts`; the plant job checks this first and exits 1 naming each id missing
from one of the three (research.md R-10). The plant job fails when an entry lacks a `fail`, a `pass` or an `error`
plant.

## Plant (`gates/plants/<gate-id>/<case>/`)

| Field | Where | Rule |
|---|---|---|
| input files | the case directory | in the gate's `plantForm`; inputs only, no gate configuration (below) |
| `expect` | `plant.json` | `fail` (a planted defect), `pass` (a near-miss or clean input the gate must accept) or `error` (a breaking plant: an input the gate cannot process) |
| `why` | `plant.json` | the defect, near-miss or breakage, in one sentence, naming the FR |
| `findings` | `plant.json`, `fail` only | the exact list of expected findings: `location` and `rule` (as in § Finding, `location` relative to the plant; for a `repo-tree` or `mutation-repo` plant relative to the temporary repository, that is the repository path below `tree/` or `head/`; for a `commit-repo` plant `commit:<n>`, the n-th record of `commits.txt`), and optionally `message`, a substring the finding's message must contain |
| `records` | `plant.json`, mutation `pass` only | the expected equivalent-mutant records: `location`, `mutator`, `reason` |
| `cause` | `plant.json`, `error` only, required | a non-empty string: a substring of the cause line the gate must print on its error output (stderr) when it exits 2 on this plant, for example a part of the unresolvable-base message for `mutation/error-unresolvable-base`; an `error` plant without it, or `cause` on a `fail` or `pass` plant, is an invalid `plant.json` (operator decision, PR #18 landing review, human:jeroennouwsdev, 2026-11-03: "Breaking plants check the cause of exit 2, not just the code"; landing note L1-04, phase 4 round 5 O5-01) |
| `base` | `plant.json`, optional, `fail` or `error` only (a `pass` plant with `base` is an invalid `plant.json`, since a base such as the temporary repository's head would make it pass vacuously; operator decision, PR #18 landing review, human:jeroennouwsdev, 2026-11-03: "pass plants may not set 'base'"; landing note L1-05, phase 4 round 5 O5-02) | a non-empty string: the base the plant presents to its gate, which the plant runner puts in place of `{base}` in the gate's plant command instead of the temporary repository's base commit (`gates/lib/plant-runner.ts` `plantValues`); a `workspace` plant has no `{base}`, so it has no effect there. Used by the mutation breaking plant `gates/plants/mutation/error-unresolvable-base/` (`refs/heads/no-such-base`, a `--base` that does not resolve). An input of the gate, like the plant's files, not gate configuration (operator decision, phase 4 round 2 note R2-02, feature gate, human:jeroennouwsdev, 2026-11-03: "Planner adds it now") |

State: a plant is **caught** when the gate exits 1 on a `fail` plant and its findings, compared as a set of
(`location`, `rule`) with each given `message` substring present, equal `findings`; **accepted** when the gate exits
0 on a `pass` plant with no finding (and, where given, exactly the expected `records`); **reported broken** when the
gate exits 2 on an `error` plant and a line of its error output contains the plant's `cause`. Anything else makes the plant job fail.

Configuration rule: plant mode runs the repository's own gate configuration and swaps only the inputs. A plant
carries no configuration: no `tsconfig*.json` and no ESLint, Stylelint, Vitest, Vite or Stryker configuration file
anywhere in its directory. `repo-tree`, `commit-repo` and `mutation-repo` plants are laid out at repository paths in
a temporary repository that holds the configuration set of research.md R-10, copied unchanged, and the gate runs
there in normal mode with `--root`, so its own file collection decides what it checks (plan squad round 3). The
plant job rejects a plant that breaks this rule ("plant X carries gate configuration").

Identities: every name and e-mail address in a plant (sign-off records) is invented and uses a reserved domain
(RFC 2606: `example.com`, `example.org`, `example.net`), never a real person's (FR-034).

## Finding (gate output line)

The one definition of a gate's finding line (contracts/gate-cli.md and research.md R-09 refer here):

`<location>: <gate-id>: <rule>: <message>`

| Part | Rule |
|---|---|
| `location` | `<path>:<line>` for a finding in a file at a line; `<path>` for a finding about a whole file (a lockfile that does not match, a missing or loose pin, a workspace setting, two configuration copies that differ, a plant that carries configuration); `<sha>`, the full 40-character commit hash, for a finding about a commit (sign-off). `path` is relative to the repository root (or to the plant directory or temporary repository in plant mode). |
| `gate-id` | the registry id |
| `rule` | the tool's rule or diagnostic id (ESLint or Stylelint rule, `TS<code>` for tsc, the test's full name for unit tests, the mutator for a surviving mutant), or the gate's own rule id (for example `inline-script`, `style-attribute`, `event-handler`, `eval`, `sk-name`, `monospace`, `no-signoff`, `signoff-mismatch`, `range`, `lockfile`, `release-age`, `allow-builds`, `copies-differ`, `disable-form`) |
| `message` | one line, naming the defect |

Equivalent-mutant records (FR-012) are printed as separate lines `<path>:<line>: mutation: record: <mutator>:
<reason>`; they are not findings.

## Story configuration (two copies, FR-006)

`test_command`, `setup_command`, `test_pathspec`, `mutation_command`, `knowledge_dir`: values in
contracts/story-config.md. The two copies are byte-identical.

## Equivalent-mutant record (FR-012)

A Stryker disable comment directly above the mutated line:
`// Stryker disable next-line <mutator[,mutator]|all>: <reason>`. `reason` is required. In changed files the mutation
wrapper reports as a finding (rule `disable-form`) a next-line record without a reason and every other disable form
(a `// Stryker disable ...` without `next-line`, including `// Stryker disable all`, and `// Stryker restore`), and
lists every record in changed code with path, line, mutator and reason.

## Commit record (sign-off check)

`hash`, `parents[]`, `author` (`Name <email>`), `message`. Exempt when `parents.length > 1`, or when `hash` equals
the full hash of the repository's root commit, `d08d4133bf0034e3d1ff29cddf2b0f13ca63290a`, and `parents` is empty
(FR-023 exempts that one commit; a record whose hash only starts with `d08d413` is not exempt). Passes when the
message has a `Signed-off-by: <author>` trailer equal to `author`. In plants, `commits.txt` holds the records in
order (a merge record names the two records it merges), and the plant job builds a temporary repository from them
on an empty, signed-off base commit and checks `<base commit>..HEAD` (research.md R-10).
