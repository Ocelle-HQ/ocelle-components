# Data Model: Repository Foundation (001)

## Gate (registry entry in `gates/gates.json`)

| Field | Type | Rule |
|---|---|---|
| `id` | string | kebab-case, unique; also the `pnpm run gate:<id>` script and the plants directory name |
| `check` | string | the CI check name shown on pull requests (contracts/ci-checks.md) |
| `command` | string | the command a normal run executes |
| `plantCommand` | string | the command run per plant, with `{plant}` replaced by the plant directory |
| `plantForm` | enum | `files`, `test-files`, `workspace`, `built-output`, `commits`, `config-pair`, `mutation-fixture` (contracts/plants.md) |
| `scope` | string | the files it checks, as in spec FR-028 |

Validation: every gate of FR-020 has exactly one entry; the plant job fails when an entry has no `fail` plant.

## Plant (`gates/plants/<gate-id>/<case>/`)

| Field | Where | Rule |
|---|---|---|
| input files | the case directory | in the gate's `plantForm` |
| `expect` | `plant.json` | `fail` (a planted defect) or `pass` (a near-miss the gate must accept) |
| `why` | `plant.json` | the defect or near-miss, in one sentence, naming the FR |

State: a plant is **caught** when the gate exits 1 on a `fail` plant, **accepted** when it exits 0 on a `pass` plant;
any other exit code (including 2) makes the plant job fail.

## Finding (gate output line)

`<path>:<line>: <gate-id>: <message>`; `path` relative to the repository (or the plant directory in plant mode).

## Story configuration (two copies, FR-006)

`test_command`, `setup_command`, `test_pathspec`, `mutation_command`, `knowledge_dir`: values in
contracts/story-config.md. The two copies are byte-identical.

## Equivalent-mutant record (FR-012)

A Stryker disable comment directly above the mutated line:
`// Stryker disable next-line <mutator>: <reason>`. `reason` is required; the mutation wrapper fails on a record
without one and lists every record in changed code with path, line, mutator and reason.

## Commit record (sign-off check)

`hash`, `parents[]`, `author` (`Name <email>`), `message`. Exempt when `parents.length > 1` or `hash` starts with
`d08d413`. Passes when the message has a `Signed-off-by: <author>` trailer equal to `author`.
