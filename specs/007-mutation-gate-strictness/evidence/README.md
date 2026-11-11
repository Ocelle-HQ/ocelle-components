# 007 evidence

## Red measurement before any mission code (phase 1, spec FR-011a, research R-06)

Taken on 2026-11-10 at the phase-1 base `bfd31fec6c61ffc8f2dcdb1616fc3b7b82e14917` (`reviews/phase-1/base.sha`),
before any 007 code: the gate, `stryker.config.json` and `vitest.mutation.config.ts` are those of `main`. op 004's
figures are context only.

**Environment.** The sandbox: 4 cores (`nproc`), Node 22.23.4 (CI pins 26.13.0), Stryker 10.1.1, `concurrency: 8`
and the TypeScript checker on, as configured. `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`;
`PLAYWRIGHT_BROWSERS_PATH` pointed at a scratchpad alias (`chromium-1248` → `/opt/pw-browsers/chromium-1243`, the
other entries of `/opt/pw-browsers` under their own names). One run at a time, nothing else heavy beside it.

**Base.** `B = $(git rev-parse ec0f533~1)` = `eaf16896ec10affdca24296fc9531fcffc46a8be`.

**Plan** (T001, `red/plan.txt`): `pnpm --silent run gate:mutation -- --base "$B" --plan`, exit 0, 28 shards. Its
stderr: `mutation: plan: 28 shards, 27 cuts within files (a mutant spanning a cut is mutated in no shard, see
gates/README.md)`, so the cut count is **27** (spec FR-009). The `source.ts` entries are exactly
`packages/tokens/src/source.ts:1-60`, `:61-120`, `:121-180` and `:181-230`. The first `packages/tokens/src/generate.ts`
entry is `packages/tokens/src/generate.ts:1-60` (FR-013 reference entry); the other reference entry is
`gates/lib/wcag.ts`.

**Command** (T002, research R-06), from the repository root, one entry at a time:

```sh
pnpm --silent run gate:mutation -- --base "$B" --files "<entry>"
```

`/usr/bin/time` is not installed in the sandbox (the first attempt ended `/usr/bin/time: No such file or directory`,
exit 127, before the gate ran; that attempt was discarded). The wall time was therefore taken by the wrapper shell
around the same command, `date +%s.%N` before and after, and is written to each run's `time.txt` (seconds to two
decimals, then the gate's exit code). Each run's folder holds `stdout.txt`, `stderr.txt` (empty in every run: the
gate prints nothing on stderr when Stryker succeeds), `time.txt` and `mutation.json` (a copy of
`reports/mutation/mutation.json`, removed before each run so no copy is stale).

**Checker split** (T003, a diagnostic): the four `source.ts` entries were run once more with `"checkers": []` as a
scratch edit of `stryker.config.json` (only that line; `plugins` unchanged), restored afterwards with
`git checkout -- stryker.config.json`. Kept under `red/<entry-slug>/no-checker/`.

**Folders.** `red/source-1-60`, `red/source-61-120`, `red/source-121-180`, `red/source-181-230`,
`red/generate-1-60` (`packages/tokens/src/generate.ts:1-60`), `red/wcag` (`gates/lib/wcag.ts`).

### Red table

Statuses are read from each run's kept `mutation.json` (the gate of `main` prints no Timeout or CompileError line).
Every run ended exit 0.

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Ignored | Time | Checker split (diagnostic, not the checker's share): checker off / difference | Within 176 s |
|---|---|---|---|---|---|---|---|---|---|---|
| `source.ts:1-60` | 135 | 70 | 0 | 0 | 0 | 65 | 0 | 227.08 s | 61.51 s / 165.57 s | **no** |
| `source.ts:61-120` | 202 | 103 | 0 | 0 | 0 | 99 | 0 | 285.43 s | 88.84 s / 196.59 s | **no** |
| `source.ts:121-180` | 224 | 67 | 46 | 0 | 0 | 111 | 0 | 537.27 s | 606.54 s / -69.27 s | **no** |
| `source.ts:181-230` | 120 | 59 | 11 | 0 | 0 | 50 | 0 | 259.26 s | 192.12 s / 67.14 s | **no** |
| `generate.ts:1-60` (FR-013 reference) | 7 | 3 | 0 | 0 | 0 | 4 | 0 | 78.11 s | - | yes |
| `gates/lib/wcag.ts` (FR-013 reference) | 33 | 26 | 2 | 0 | 0 | 3 | 2 | 90.92 s | - | yes |

The gate's own lines: `source.ts` entries `mutation: 135` / `202` / `224` / `120 mutants on the changed lines of 1
file, none survived; 0 equivalent records`; `generate.ts:1-60` `7 mutants …; 0 equivalent records`; `wcag.ts` one
`record` line (`gates/lib/wcag.ts:9: mutation: record: EqualityOperator: equivalent, …`, the two Ignored mutants) and
`33 mutants …; 1 equivalent record`.

**Checker split, the runs with the checker off** (statuses from `no-checker/mutation.json`):

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Time (checker off) | Time (checker on) | Expected checker figure from 001 (R-05, about 0.6 s per mutant at concurrency 8) |
|---|---|---|---|---|---|---|---|---|---|
| `source.ts:1-60` | 135 | 135 | 0 | 0 | 0 | 0 | 61.51 s | 227.08 s | ≈ 81 s |
| `source.ts:61-120` | 202 | 202 | 0 | 0 | 0 | 0 | 88.84 s | 285.43 s | ≈ 121 s |
| `source.ts:121-180` | 224 | 127 | 97 | 0 | 0 | 0 | 606.54 s | 537.27 s | ≈ 134 s |
| `source.ts:181-230` | 120 | 96 | 24 | 0 | 0 | 0 | 192.12 s | 259.26 s | ≈ 72 s |

The difference is not the checker's share (research R-06): with the checker on, `concurrency: 8` gives four checkers
and four test runners, against eight test runners with it off, and the CompileErrors of the checker-on run reach the
tests in the checker-off run. In `121-180` the checker-off run is the slower one: its 52 group-A mutants that the
checker rejects as CompileError (below) run the whole suite there and end Timeout. No lever is chosen or skipped on
these figures.

Per-mutant comparison of each entry's checker-on and checker-off runs, keyed by start and end (line, column), mutator
and replacement (no key repeats within a run, and every key is in both runs):

| Entry | Killed → Killed | CompileError → Killed | CompileError → Timeout | Timeout → Timeout | Timeout → Killed |
|---|---|---|---|---|---|
| `source.ts:1-60` | 70 | 65 | 0 | 0 | 0 |
| `source.ts:61-120` | 103 | 99 | 0 | 0 | 0 |
| `source.ts:121-180` | 67 | 59 | 52 | 45 | 1 (`shell-inspector-width` value, `178:59-178:66`) |
| `source.ts:181-230` | 59 | 37 | 13 | 11 | 0 |

So the checker-off runs reproduce op 004's final figures exactly (121 Timeouts: 97 and 24; 65 `group` → `""`
(op 004 group A), 53 plain values (group B) and 3 elevation themed values (group C)). With the checker on, the 65
group-A Timeouts are CompileErrors, and the Timeouts are the 56 of groups B and C plus `shell-inspector-width`'s
value, 57 in all.

**Killed by** (test file of each `killedBy` id, checker on): `1-60`: 69 `gates/test/token-only.test.ts`, 1
`gates/test/contrast.test.ts`; `61-120`: 99 `contrast.test.ts`, 4 `token-only.test.ts`; `121-180`: 60
`contrast.test.ts`, 5 `gates/test/brand-rules.test.ts`, 2 `storybook/test/unit/stories.test.ts`; `181-230`: 57
`contrast.test.ts`, 2 `stories.test.ts`. No `source.ts` mutant was killed by a test under `packages/tokens/test/`.

**What the red figures say** (spec FR-009, FR-010): all four `source.ts` entries miss 176 s with the checker on as
configured (227 s, 285 s, 537 s, 259 s), and two keep Timeouts (46 and 11). None has a Survived or NoCoverage mutant.
The two reference entries are within 176 s.

**Stop-and-ask point reached (tasks.md "any mutation shard over 10 minutes").** The checker-off diagnostic run of
`source.ts:121-180` took 606.54 s, over 600 s. It is a scratch configuration (checker off), not a run of the gate as
configured, whose `121-180` run took 537.27 s; it is recorded as measured and not repeated or worked around. The
question for the operator: does this point apply to the phase-1 diagnostic run, and does it change how the mission
proceeds?

### How the record, field and theme were read

From each kept `mutation.json` alone: the report's copy of the file's source (`files[path].source`) was parsed with
the TypeScript compiler API, and each mutant's start position located in it. `Record` is the `name` of the token
record object around the mutant (`-` outside the `records` list); `Field` is the record's property around the mutant
(`(whole record)` for the record object itself, `const <name>` or `function <name>` outside the list); `Theme` is
`light` or `dark` when the mutant sits inside a themed value or `ref`, `-` otherwise. Start-end is the report's
`location` (1-based line, 1-based column, as Stryker writes it). The scratch scripts were not kept (research R-06: no
script is needed in the evidence folder); the lists can be re-read from the kept reports.

### Every Timeout and CompileError of each `source.ts` entry (checker on, the red run)

Sorted by start (line, column), then mutator.

#### `packages/tokens/src/source.ts:1-60` (0 Timeout, 65 CompileError)

| Status | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement |
|---|---|---|---|---|---|---|
| CompileError | `-` | const main | - | ArrayDeclaration | 13:14-23:2 | `[]` |
| CompileError | `-` | const stateGrounds | - | ArrayDeclaration | 25:22-25:118 | `[]` |
| CompileError | `-` | const chrome | - | ArrayDeclaration | 27:16-27:54 | `[]` |
| CompileError | `-` | function tokenRecords | - | BlockStatement | 30:151-32:2 | `{}` |
| CompileError | `color-canvas` | (whole record) | - | ObjectLiteral | 36:3-36:90 | `{}` |
| CompileError | `color-canvas` | name | - | StringLiteral | 36:11-36:25 | `""` |
| CompileError | `color-canvas` | group | - | StringLiteral | 36:34-36:42 | `""` |
| CompileError | `color-canvas` | value | - | ObjectLiteral | 36:51-36:88 | `{}` |
| CompileError | `color-sheet` | (whole record) | - | ObjectLiteral | 37:3-37:89 | `{}` |
| CompileError | `color-sheet` | group | - | StringLiteral | 37:33-37:41 | `""` |
| CompileError | `color-sheet` | value | - | ObjectLiteral | 37:50-37:87 | `{}` |
| CompileError | `color-pane` | (whole record) | - | ObjectLiteral | 38:3-38:88 | `{}` |
| CompileError | `color-pane` | group | - | StringLiteral | 38:32-38:40 | `""` |
| CompileError | `color-pane` | value | - | ObjectLiteral | 38:49-38:86 | `{}` |
| CompileError | `color-panel` | (whole record) | - | ObjectLiteral | 39:3-39:89 | `{}` |
| CompileError | `color-panel` | group | - | StringLiteral | 39:33-39:41 | `""` |
| CompileError | `color-panel` | value | - | ObjectLiteral | 39:50-39:87 | `{}` |
| CompileError | `color-inspector` | (whole record) | - | ObjectLiteral | 40:3-40:93 | `{}` |
| CompileError | `color-inspector` | group | - | StringLiteral | 40:37-40:45 | `""` |
| CompileError | `color-inspector` | value | - | ObjectLiteral | 40:54-40:91 | `{}` |
| CompileError | `color-rail` | (whole record) | - | ObjectLiteral | 41:3-41:88 | `{}` |
| CompileError | `color-rail` | group | - | StringLiteral | 41:32-41:40 | `""` |
| CompileError | `color-rail` | value | - | ObjectLiteral | 41:49-41:86 | `{}` |
| CompileError | `color-inset` | (whole record) | - | ObjectLiteral | 42:3-42:89 | `{}` |
| CompileError | `color-inset` | group | - | StringLiteral | 42:33-42:41 | `""` |
| CompileError | `color-inset` | value | - | ObjectLiteral | 42:50-42:87 | `{}` |
| CompileError | `color-ink` | (whole record) | - | ObjectLiteral | 43:3-43:130 | `{}` |
| CompileError | `color-ink` | group | - | StringLiteral | 43:31-43:39 | `""` |
| CompileError | `color-ink` | value | - | ObjectLiteral | 43:48-43:85 | `{}` |
| CompileError | `color-ink` | contrast | - | ObjectLiteral | 43:97-43:128 | `{}` |
| CompileError | `color-ink` | kind | - | StringLiteral | 43:105-43:111 | `""` |
| CompileError | `color-ink-soft` | (whole record) | - | ObjectLiteral | 45:3-45:135 | `{}` |
| CompileError | `color-ink-soft` | group | - | StringLiteral | 45:36-45:44 | `""` |
| CompileError | `color-ink-soft` | value | - | ObjectLiteral | 45:53-45:90 | `{}` |
| CompileError | `color-ink-soft` | contrast | - | ObjectLiteral | 45:102-45:133 | `{}` |
| CompileError | `color-ink-soft` | kind | - | StringLiteral | 45:110-45:116 | `""` |
| CompileError | `color-ink-muted` | (whole record) | - | ObjectLiteral | 47:3-47:136 | `{}` |
| CompileError | `color-ink-muted` | group | - | StringLiteral | 47:37-47:45 | `""` |
| CompileError | `color-ink-muted` | value | - | ObjectLiteral | 47:54-47:91 | `{}` |
| CompileError | `color-ink-muted` | contrast | - | ObjectLiteral | 47:103-47:134 | `{}` |
| CompileError | `color-ink-muted` | kind | - | StringLiteral | 47:111-47:117 | `""` |
| CompileError | `color-rule` | (whole record) | - | ObjectLiteral | 48:3-48:88 | `{}` |
| CompileError | `color-rule` | group | - | StringLiteral | 48:32-48:40 | `""` |
| CompileError | `color-rule` | value | - | ObjectLiteral | 48:49-48:86 | `{}` |
| CompileError | `color-rule-strong` | (whole record) | - | ObjectLiteral | 49:3-49:95 | `{}` |
| CompileError | `color-rule-strong` | group | - | StringLiteral | 49:39-49:47 | `""` |
| CompileError | `color-rule-strong` | value | - | ObjectLiteral | 49:56-49:93 | `{}` |
| CompileError | `color-control-border` | (whole record) | - | ObjectLiteral | 51:3-56:4 | `{}` |
| CompileError | `color-control-border` | group | - | StringLiteral | 53:12-53:20 | `""` |
| CompileError | `color-control-border` | value | - | ObjectLiteral | 54:12-54:49 | `{}` |
| CompileError | `color-control-border` | contrast | - | ObjectLiteral | 55:15-55:139 | `{}` |
| CompileError | `color-control-border` | kind | - | StringLiteral | 55:23-55:33 | `""` |
| CompileError | `color-chrome` | (whole record) | - | ObjectLiteral | 57:3-57:90 | `{}` |
| CompileError | `color-chrome` | group | - | StringLiteral | 57:34-57:42 | `""` |
| CompileError | `color-chrome` | value | - | ObjectLiteral | 57:51-57:88 | `{}` |
| CompileError | `color-chrome-ink` | (whole record) | - | ObjectLiteral | 58:3-58:139 | `{}` |
| CompileError | `color-chrome-ink` | group | - | StringLiteral | 58:38-58:46 | `""` |
| CompileError | `color-chrome-ink` | value | - | ObjectLiteral | 58:55-58:92 | `{}` |
| CompileError | `color-chrome-ink` | contrast | - | ObjectLiteral | 58:104-58:137 | `{}` |
| CompileError | `color-chrome-ink` | kind | - | StringLiteral | 58:112-58:118 | `""` |
| CompileError | `color-chrome-muted` | (whole record) | - | ObjectLiteral | 59:3-59:141 | `{}` |
| CompileError | `color-chrome-muted` | group | - | StringLiteral | 59:40-59:48 | `""` |
| CompileError | `color-chrome-muted` | value | - | ObjectLiteral | 59:57-59:94 | `{}` |
| CompileError | `color-chrome-muted` | contrast | - | ObjectLiteral | 59:106-59:139 | `{}` |
| CompileError | `color-chrome-muted` | kind | - | StringLiteral | 59:114-59:120 | `""` |

#### `packages/tokens/src/source.ts:61-120` (0 Timeout, 99 CompileError)

| Status | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement |
|---|---|---|---|---|---|---|
| CompileError | `color-chrome-hover` | (whole record) | - | ObjectLiteral | 61:3-61:96 | `{}` |
| CompileError | `color-chrome-hover` | group | - | StringLiteral | 61:40-61:48 | `""` |
| CompileError | `color-chrome-hover` | value | - | ObjectLiteral | 61:57-61:94 | `{}` |
| CompileError | `color-accent` | (whole record) | - | ObjectLiteral | 62:3-62:90 | `{}` |
| CompileError | `color-accent` | group | - | StringLiteral | 62:34-62:42 | `""` |
| CompileError | `color-accent` | value | - | ObjectLiteral | 62:51-62:88 | `{}` |
| CompileError | `color-on-accent` | (whole record) | - | ObjectLiteral | 64:3-64:148 | `{}` |
| CompileError | `color-on-accent` | group | - | StringLiteral | 64:37-64:45 | `""` |
| CompileError | `color-on-accent` | value | - | ObjectLiteral | 64:54-64:91 | `{}` |
| CompileError | `color-on-accent` | contrast | - | ObjectLiteral | 64:103-64:146 | `{}` |
| CompileError | `color-on-accent` | kind | - | StringLiteral | 64:111-64:117 | `""` |
| CompileError | `color-accent-low` | (whole record) | - | ObjectLiteral | 65:3-65:94 | `{}` |
| CompileError | `color-accent-low` | group | - | StringLiteral | 65:38-65:46 | `""` |
| CompileError | `color-accent-low` | value | - | ObjectLiteral | 65:55-65:92 | `{}` |
| CompileError | `color-accent-strong` | (whole record) | - | ObjectLiteral | 67:3-72:4 | `{}` |
| CompileError | `color-accent-strong` | group | - | StringLiteral | 69:12-69:20 | `""` |
| CompileError | `color-accent-strong` | value | - | ObjectLiteral | 70:12-70:49 | `{}` |
| CompileError | `color-accent-strong` | contrast | - | ObjectLiteral | 71:15-71:116 | `{}` |
| CompileError | `color-accent-strong` | kind | - | StringLiteral | 71:23-71:33 | `""` |
| CompileError | `color-focus` | (whole record) | - | ObjectLiteral | 74:3-80:4 | `{}` |
| CompileError | `color-focus` | group | - | StringLiteral | 76:12-76:20 | `""` |
| CompileError | `color-focus` | value | - | ObjectLiteral | 77:12-77:101 | `{}` |
| CompileError | `color-focus` | ref | - | ObjectLiteral | 78:10-78:75 | `{}` |
| CompileError | `color-focus` | contrast | - | ObjectLiteral | 79:15-79:83 | `{}` |
| CompileError | `color-focus` | kind | - | StringLiteral | 79:23-79:33 | `""` |
| CompileError | `color-current` | (whole record) | - | ObjectLiteral | 82:3-88:4 | `{}` |
| CompileError | `color-current` | group | - | StringLiteral | 84:12-84:20 | `""` |
| CompileError | `color-current` | value | - | ObjectLiteral | 85:12-85:101 | `{}` |
| CompileError | `color-current` | ref | - | ObjectLiteral | 86:10-86:75 | `{}` |
| CompileError | `color-current` | contrast | - | ObjectLiteral | 87:15-87:91 | `{}` |
| CompileError | `color-current` | kind | - | StringLiteral | 87:23-87:33 | `""` |
| CompileError | `color-link` | (whole record) | - | ObjectLiteral | 90:3-90:153 | `{}` |
| CompileError | `color-link` | group | - | StringLiteral | 90:32-90:40 | `""` |
| CompileError | `color-link` | value | - | ObjectLiteral | 90:49-90:86 | `{}` |
| CompileError | `color-link` | contrast | - | ObjectLiteral | 90:98-90:151 | `{}` |
| CompileError | `color-link` | kind | - | StringLiteral | 90:106-90:112 | `""` |
| CompileError | `color-link-hover` | (whole record) | - | ObjectLiteral | 92:3-92:137 | `{}` |
| CompileError | `color-link-hover` | group | - | StringLiteral | 92:38-92:46 | `""` |
| CompileError | `color-link-hover` | value | - | ObjectLiteral | 92:55-92:92 | `{}` |
| CompileError | `color-link-hover` | contrast | - | ObjectLiteral | 92:104-92:135 | `{}` |
| CompileError | `color-link-hover` | kind | - | StringLiteral | 92:112-92:118 | `""` |
| CompileError | `color-hover-bg` | (whole record) | - | ObjectLiteral | 93:3-93:92 | `{}` |
| CompileError | `color-hover-bg` | group | - | StringLiteral | 93:36-93:44 | `""` |
| CompileError | `color-hover-bg` | value | - | ObjectLiteral | 93:53-93:90 | `{}` |
| CompileError | `color-disabled-ink` | (whole record) | - | ObjectLiteral | 95:3-100:4 | `{}` |
| CompileError | `color-disabled-ink` | group | - | StringLiteral | 97:12-97:20 | `""` |
| CompileError | `color-disabled-ink` | value | - | ObjectLiteral | 98:12-98:49 | `{}` |
| CompileError | `color-disabled-ink` | contrast | - | ObjectLiteral | 99:15-99:86 | `{}` |
| CompileError | `color-disabled-ink` | kind | - | StringLiteral | 99:23-99:29 | `""` |
| CompileError | `color-disabled-ink` | exempt | - | BooleanLiteral | 99:80-99:84 | `false` |
| CompileError | `color-disabled-bg` | (whole record) | - | ObjectLiteral | 101:3-101:95 | `{}` |
| CompileError | `color-disabled-bg` | group | - | StringLiteral | 101:39-101:47 | `""` |
| CompileError | `color-disabled-bg` | value | - | ObjectLiteral | 101:56-101:93 | `{}` |
| CompileError | `color-overlay` | (whole record) | - | ObjectLiteral | 102:3-102:113 | `{}` |
| CompileError | `color-overlay` | group | - | StringLiteral | 102:35-102:43 | `""` |
| CompileError | `color-overlay` | value | - | ObjectLiteral | 102:52-102:111 | `{}` |
| CompileError | `color-danger` | (whole record) | - | ObjectLiteral | 104:3-104:157 | `{}` |
| CompileError | `color-danger` | group | - | StringLiteral | 104:34-104:42 | `""` |
| CompileError | `color-danger` | value | - | ObjectLiteral | 104:51-104:88 | `{}` |
| CompileError | `color-danger` | contrast | - | ObjectLiteral | 104:100-104:155 | `{}` |
| CompileError | `color-danger` | kind | - | StringLiteral | 104:108-104:114 | `""` |
| CompileError | `color-danger-bg` | (whole record) | - | ObjectLiteral | 105:3-105:93 | `{}` |
| CompileError | `color-danger-bg` | group | - | StringLiteral | 105:37-105:45 | `""` |
| CompileError | `color-danger-bg` | value | - | ObjectLiteral | 105:54-105:91 | `{}` |
| CompileError | `color-warning` | (whole record) | - | ObjectLiteral | 107:3-107:159 | `{}` |
| CompileError | `color-warning` | group | - | StringLiteral | 107:35-107:43 | `""` |
| CompileError | `color-warning` | value | - | ObjectLiteral | 107:52-107:89 | `{}` |
| CompileError | `color-warning` | contrast | - | ObjectLiteral | 107:101-107:157 | `{}` |
| CompileError | `color-warning` | kind | - | StringLiteral | 107:109-107:115 | `""` |
| CompileError | `color-warning-bg` | (whole record) | - | ObjectLiteral | 108:3-108:94 | `{}` |
| CompileError | `color-warning-bg` | group | - | StringLiteral | 108:38-108:46 | `""` |
| CompileError | `color-warning-bg` | value | - | ObjectLiteral | 108:55-108:92 | `{}` |
| CompileError | `color-success` | (whole record) | - | ObjectLiteral | 110:3-110:159 | `{}` |
| CompileError | `color-success` | group | - | StringLiteral | 110:35-110:43 | `""` |
| CompileError | `color-success` | value | - | ObjectLiteral | 110:52-110:89 | `{}` |
| CompileError | `color-success` | contrast | - | ObjectLiteral | 110:101-110:157 | `{}` |
| CompileError | `color-success` | kind | - | StringLiteral | 110:109-110:115 | `""` |
| CompileError | `color-success-bg` | (whole record) | - | ObjectLiteral | 111:3-111:94 | `{}` |
| CompileError | `color-success-bg` | group | - | StringLiteral | 111:38-111:46 | `""` |
| CompileError | `color-success-bg` | value | - | ObjectLiteral | 111:55-111:92 | `{}` |
| CompileError | `color-info` | (whole record) | - | ObjectLiteral | 113:3-113:153 | `{}` |
| CompileError | `color-info` | group | - | StringLiteral | 113:32-113:40 | `""` |
| CompileError | `color-info` | value | - | ObjectLiteral | 113:49-113:86 | `{}` |
| CompileError | `color-info` | contrast | - | ObjectLiteral | 113:98-113:151 | `{}` |
| CompileError | `color-info` | kind | - | StringLiteral | 113:106-113:112 | `""` |
| CompileError | `color-info-bg` | (whole record) | - | ObjectLiteral | 114:3-114:91 | `{}` |
| CompileError | `color-info-bg` | group | - | StringLiteral | 114:35-114:43 | `""` |
| CompileError | `color-info-bg` | value | - | ObjectLiteral | 114:52-114:89 | `{}` |
| CompileError | `color-neutral` | (whole record) | - | ObjectLiteral | 116:3-116:159 | `{}` |
| CompileError | `color-neutral` | group | - | StringLiteral | 116:35-116:43 | `""` |
| CompileError | `color-neutral` | value | - | ObjectLiteral | 116:52-116:89 | `{}` |
| CompileError | `color-neutral` | contrast | - | ObjectLiteral | 116:101-116:157 | `{}` |
| CompileError | `color-neutral` | kind | - | StringLiteral | 116:109-116:115 | `""` |
| CompileError | `color-neutral-bg` | (whole record) | - | ObjectLiteral | 117:3-117:94 | `{}` |
| CompileError | `color-neutral-bg` | group | - | StringLiteral | 117:38-117:46 | `""` |
| CompileError | `color-neutral-bg` | value | - | ObjectLiteral | 117:55-117:92 | `{}` |
| CompileError | `color-scheme` | (whole record) | - | ObjectLiteral | 119:3-119:85 | `{}` |
| CompileError | `color-scheme` | group | - | StringLiteral | 119:34-119:42 | `""` |
| CompileError | `color-scheme` | value | - | ObjectLiteral | 119:51-119:83 | `{}` |

#### `packages/tokens/src/source.ts:121-180` (46 Timeout, 111 CompileError)

| Status | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement |
|---|---|---|---|---|---|---|
| CompileError | `font-sans` | (whole record) | - | ObjectLiteral | 122:3-122:117 | `{}` |
| CompileError | `font-sans` | group | - | StringLiteral | 122:31-122:37 | `""` |
| Timeout | `font-sans` | value | - | StringLiteral | 122:46-122:115 | `""` |
| CompileError | `font-display` | (whole record) | - | ObjectLiteral | 123:3-123:96 | `{}` |
| CompileError | `font-display` | group | - | StringLiteral | 123:34-123:40 | `""` |
| CompileError | `figures` | (whole record) | - | ObjectLiteral | 124:3-124:60 | `{}` |
| CompileError | `figures` | group | - | StringLiteral | 124:29-124:35 | `""` |
| Timeout | `figures` | value | - | StringLiteral | 124:44-124:58 | `""` |
| CompileError | `font-size-xs` | (whole record) | - | ObjectLiteral | 125:3-125:60 | `{}` |
| CompileError | `font-size-xs` | group | - | StringLiteral | 125:34-125:40 | `""` |
| Timeout | `font-size-xs` | value | - | StringLiteral | 125:49-125:58 | `""` |
| CompileError | `font-size-sm` | (whole record) | - | ObjectLiteral | 126:3-126:61 | `{}` |
| CompileError | `font-size-sm` | group | - | StringLiteral | 126:34-126:40 | `""` |
| Timeout | `font-size-sm` | value | - | StringLiteral | 126:49-126:59 | `""` |
| CompileError | `font-size-md` | (whole record) | - | ObjectLiteral | 127:3-127:57 | `{}` |
| CompileError | `font-size-md` | group | - | StringLiteral | 127:34-127:40 | `""` |
| Timeout | `font-size-md` | value | - | StringLiteral | 127:49-127:55 | `""` |
| CompileError | `font-size-fact` | (whole record) | - | ObjectLiteral | 128:3-128:64 | `{}` |
| CompileError | `font-size-fact` | group | - | StringLiteral | 128:36-128:42 | `""` |
| Timeout | `font-size-fact` | value | - | StringLiteral | 128:51-128:62 | `""` |
| CompileError | `font-size-subhead` | (whole record) | - | ObjectLiteral | 129:3-129:66 | `{}` |
| CompileError | `font-size-subhead` | group | - | StringLiteral | 129:39-129:45 | `""` |
| Timeout | `font-size-subhead` | value | - | StringLiteral | 129:54-129:64 | `""` |
| CompileError | `font-size-lg` | (whole record) | - | ObjectLiteral | 130:3-130:60 | `{}` |
| CompileError | `font-size-lg` | group | - | StringLiteral | 130:34-130:40 | `""` |
| Timeout | `font-size-lg` | value | - | StringLiteral | 130:49-130:58 | `""` |
| CompileError | `font-size-xl` | (whole record) | - | ObjectLiteral | 131:3-131:59 | `{}` |
| CompileError | `font-size-xl` | group | - | StringLiteral | 131:34-131:40 | `""` |
| Timeout | `font-size-xl` | value | - | StringLiteral | 131:49-131:57 | `""` |
| CompileError | `font-size-2xl` | (whole record) | - | ObjectLiteral | 132:3-132:62 | `{}` |
| CompileError | `font-size-2xl` | group | - | StringLiteral | 132:35-132:41 | `""` |
| Timeout | `font-size-2xl` | value | - | StringLiteral | 132:50-132:60 | `""` |
| CompileError | `line-height-tight` | (whole record) | - | ObjectLiteral | 133:3-133:62 | `{}` |
| CompileError | `line-height-tight` | group | - | StringLiteral | 133:39-133:45 | `""` |
| Timeout | `line-height-tight` | value | - | StringLiteral | 133:54-133:60 | `""` |
| CompileError | `line-height-normal` | (whole record) | - | ObjectLiteral | 134:3-134:63 | `{}` |
| CompileError | `line-height-normal` | group | - | StringLiteral | 134:40-134:46 | `""` |
| Timeout | `line-height-normal` | value | - | StringLiteral | 134:55-134:61 | `""` |
| CompileError | `line-height-relaxed` | (whole record) | - | ObjectLiteral | 135:3-135:64 | `{}` |
| CompileError | `line-height-relaxed` | group | - | StringLiteral | 135:41-135:47 | `""` |
| Timeout | `line-height-relaxed` | value | - | StringLiteral | 135:56-135:62 | `""` |
| CompileError | `line-height-compact` | (whole record) | - | ObjectLiteral | 136:3-136:63 | `{}` |
| CompileError | `line-height-compact` | group | - | StringLiteral | 136:41-136:47 | `""` |
| Timeout | `line-height-compact` | value | - | StringLiteral | 136:56-136:61 | `""` |
| CompileError | `line-height-prose` | (whole record) | - | ObjectLiteral | 137:3-137:62 | `{}` |
| CompileError | `line-height-prose` | group | - | StringLiteral | 137:39-137:45 | `""` |
| Timeout | `line-height-prose` | value | - | StringLiteral | 137:54-137:60 | `""` |
| CompileError | `font-weight-regular` | (whole record) | - | ObjectLiteral | 138:3-138:63 | `{}` |
| CompileError | `font-weight-regular` | group | - | StringLiteral | 138:41-138:47 | `""` |
| Timeout | `font-weight-regular` | value | - | StringLiteral | 138:56-138:61 | `""` |
| CompileError | `font-weight-medium` | (whole record) | - | ObjectLiteral | 139:3-139:62 | `{}` |
| CompileError | `font-weight-medium` | group | - | StringLiteral | 139:40-139:46 | `""` |
| Timeout | `font-weight-medium` | value | - | StringLiteral | 139:55-139:60 | `""` |
| CompileError | `font-weight-strong` | (whole record) | - | ObjectLiteral | 140:3-140:62 | `{}` |
| CompileError | `font-weight-strong` | group | - | StringLiteral | 140:40-140:46 | `""` |
| Timeout | `font-weight-strong` | value | - | StringLiteral | 140:55-140:60 | `""` |
| CompileError | `font-weight-display` | (whole record) | - | ObjectLiteral | 141:3-141:63 | `{}` |
| CompileError | `font-weight-display` | group | - | StringLiteral | 141:41-141:47 | `""` |
| Timeout | `font-weight-display` | value | - | StringLiteral | 141:56-141:61 | `""` |
| CompileError | `tracking-display` | (whole record) | - | ObjectLiteral | 142:3-142:64 | `{}` |
| CompileError | `tracking-display` | group | - | StringLiteral | 142:38-142:44 | `""` |
| Timeout | `tracking-display` | value | - | StringLiteral | 142:53-142:62 | `""` |
| CompileError | `space-1` | (whole record) | - | ObjectLiteral | 145:3-145:56 | `{}` |
| CompileError | `space-1` | group | - | StringLiteral | 145:29-145:36 | `""` |
| Timeout | `space-1` | value | - | StringLiteral | 145:45-145:54 | `""` |
| CompileError | `space-2` | (whole record) | - | ObjectLiteral | 146:3-146:55 | `{}` |
| CompileError | `space-2` | group | - | StringLiteral | 146:29-146:36 | `""` |
| Timeout | `space-2` | value | - | StringLiteral | 146:45-146:53 | `""` |
| CompileError | `space-3` | (whole record) | - | ObjectLiteral | 147:3-147:56 | `{}` |
| CompileError | `space-3` | group | - | StringLiteral | 147:29-147:36 | `""` |
| Timeout | `space-3` | value | - | StringLiteral | 147:45-147:54 | `""` |
| CompileError | `space-4` | (whole record) | - | ObjectLiteral | 148:3-148:53 | `{}` |
| CompileError | `space-4` | group | - | StringLiteral | 148:29-148:36 | `""` |
| Timeout | `space-4` | value | - | StringLiteral | 148:45-148:51 | `""` |
| CompileError | `space-5` | (whole record) | - | ObjectLiteral | 149:3-149:56 | `{}` |
| CompileError | `space-5` | group | - | StringLiteral | 149:29-149:36 | `""` |
| Timeout | `space-5` | value | - | StringLiteral | 149:45-149:54 | `""` |
| CompileError | `space-6` | (whole record) | - | ObjectLiteral | 150:3-150:55 | `{}` |
| CompileError | `space-6` | group | - | StringLiteral | 150:29-150:36 | `""` |
| Timeout | `space-6` | value | - | StringLiteral | 150:45-150:53 | `""` |
| CompileError | `space-7` | (whole record) | - | ObjectLiteral | 151:3-151:53 | `{}` |
| CompileError | `space-7` | group | - | StringLiteral | 151:29-151:36 | `""` |
| Timeout | `space-7` | value | - | StringLiteral | 151:45-151:51 | `""` |
| CompileError | `space-8` | (whole record) | - | ObjectLiteral | 152:3-152:55 | `{}` |
| CompileError | `space-8` | group | - | StringLiteral | 152:29-152:36 | `""` |
| Timeout | `space-8` | value | - | StringLiteral | 152:45-152:53 | `""` |
| CompileError | `space-9` | (whole record) | - | ObjectLiteral | 153:3-153:53 | `{}` |
| CompileError | `space-9` | group | - | StringLiteral | 153:29-153:36 | `""` |
| Timeout | `space-9` | value | - | StringLiteral | 153:45-153:51 | `""` |
| CompileError | `space-10` | (whole record) | - | ObjectLiteral | 154:3-154:54 | `{}` |
| CompileError | `space-10` | group | - | StringLiteral | 154:30-154:37 | `""` |
| Timeout | `space-10` | value | - | StringLiteral | 154:46-154:52 | `""` |
| CompileError | `gutter` | (whole record) | - | ObjectLiteral | 155:3-155:87 | `{}` |
| CompileError | `gutter` | name | - | StringLiteral | 155:11-155:19 | `""` |
| CompileError | `gutter` | group | - | StringLiteral | 155:28-155:35 | `""` |
| CompileError | `radius-1` | (whole record) | - | ObjectLiteral | 156:3-156:53 | `{}` |
| CompileError | `radius-1` | group | - | StringLiteral | 156:30-156:37 | `""` |
| CompileError | `radius-2` | (whole record) | - | ObjectLiteral | 157:3-157:53 | `{}` |
| CompileError | `radius-2` | group | - | StringLiteral | 157:30-157:37 | `""` |
| CompileError | `radius-row` | (whole record) | - | ObjectLiteral | 158:3-158:55 | `{}` |
| CompileError | `radius-row` | group | - | StringLiteral | 158:32-158:39 | `""` |
| CompileError | `radius-shell` | (whole record) | - | ObjectLiteral | 159:3-159:58 | `{}` |
| CompileError | `radius-shell` | group | - | StringLiteral | 159:34-159:41 | `""` |
| CompileError | `radius-pill` | (whole record) | - | ObjectLiteral | 160:3-160:58 | `{}` |
| CompileError | `radius-pill` | group | - | StringLiteral | 160:33-160:40 | `""` |
| CompileError | `border-width` | (whole record) | - | ObjectLiteral | 161:3-161:57 | `{}` |
| CompileError | `border-width` | group | - | StringLiteral | 161:34-161:41 | `""` |
| Timeout | `border-width` | value | - | StringLiteral | 161:50-161:55 | `""` |
| CompileError | `focus-width` | (whole record) | - | ObjectLiteral | 162:3-162:56 | `{}` |
| CompileError | `focus-width` | group | - | StringLiteral | 162:33-162:40 | `""` |
| Timeout | `focus-width` | value | - | StringLiteral | 162:49-162:54 | `""` |
| CompileError | `focus-offset` | (whole record) | - | ObjectLiteral | 163:3-163:57 | `{}` |
| CompileError | `focus-offset` | group | - | StringLiteral | 163:34-163:41 | `""` |
| Timeout | `focus-offset` | value | - | StringLiteral | 163:50-163:55 | `""` |
| CompileError | `bar-width` | (whole record) | - | ObjectLiteral | 164:3-164:54 | `{}` |
| CompileError | `bar-width` | group | - | StringLiteral | 164:31-164:38 | `""` |
| Timeout | `bar-width` | value | - | StringLiteral | 164:47-164:52 | `""` |
| CompileError | `ring-step` | (whole record) | - | ObjectLiteral | 165:3-165:56 | `{}` |
| CompileError | `ring-step` | group | - | StringLiteral | 165:31-165:38 | `""` |
| Timeout | `ring-step` | value | - | StringLiteral | 165:47-165:54 | `""` |
| CompileError | `target-min` | (whole record) | - | ObjectLiteral | 166:3-166:58 | `{}` |
| CompileError | `target-min` | group | - | StringLiteral | 166:32-166:38 | `""` |
| Timeout | `target-min` | value | - | StringLiteral | 166:47-166:56 | `""` |
| CompileError | `icon-size` | (whole record) | - | ObjectLiteral | 167:3-167:57 | `{}` |
| CompileError | `icon-size` | group | - | StringLiteral | 167:31-167:37 | `""` |
| Timeout | `icon-size` | value | - | StringLiteral | 167:46-167:55 | `""` |
| CompileError | `size-dot` | (whole record) | - | ObjectLiteral | 168:3-168:56 | `{}` |
| CompileError | `size-dot` | group | - | StringLiteral | 168:30-168:36 | `""` |
| Timeout | `size-dot` | value | - | StringLiteral | 168:45-168:54 | `""` |
| CompileError | `size-step` | (whole record) | - | ObjectLiteral | 169:3-169:56 | `{}` |
| CompileError | `size-step` | group | - | StringLiteral | 169:31-169:37 | `""` |
| Timeout | `size-step` | value | - | StringLiteral | 169:46-169:54 | `""` |
| CompileError | `size-avatar` | (whole record) | - | ObjectLiteral | 170:3-170:58 | `{}` |
| CompileError | `size-avatar` | group | - | StringLiteral | 170:33-170:39 | `""` |
| Timeout | `size-avatar` | value | - | StringLiteral | 170:48-170:56 | `""` |
| CompileError | `size-rail-item` | (whole record) | - | ObjectLiteral | 171:3-171:61 | `{}` |
| CompileError | `size-rail-item` | group | - | StringLiteral | 171:36-171:42 | `""` |
| Timeout | `size-rail-item` | value | - | StringLiteral | 171:51-171:59 | `""` |
| CompileError | `size-visually-hidden` | (whole record) | - | ObjectLiteral | 172:3-172:64 | `{}` |
| CompileError | `size-visually-hidden` | group | - | StringLiteral | 172:42-172:48 | `""` |
| Timeout | `size-visually-hidden` | value | - | StringLiteral | 172:57-172:62 | `""` |
| CompileError | `shell-topbar-height` | (whole record) | - | ObjectLiteral | 175:3-175:68 | `{}` |
| CompileError | `shell-topbar-height` | group | - | StringLiteral | 175:41-175:48 | `""` |
| Timeout | `shell-topbar-height` | value | - | StringLiteral | 175:57-175:66 | `""` |
| CompileError | `shell-rail-width` | (whole record) | - | ObjectLiteral | 176:3-176:65 | `{}` |
| CompileError | `shell-rail-width` | group | - | StringLiteral | 176:38-176:45 | `""` |
| Timeout | `shell-rail-width` | value | - | StringLiteral | 176:54-176:63 | `""` |
| CompileError | `shell-sidebar-width` | (whole record) | - | ObjectLiteral | 177:3-177:66 | `{}` |
| CompileError | `shell-sidebar-width` | group | - | StringLiteral | 177:41-177:48 | `""` |
| Timeout | `shell-sidebar-width` | value | - | StringLiteral | 177:57-177:64 | `""` |
| CompileError | `shell-inspector-width` | (whole record) | - | ObjectLiteral | 178:3-178:68 | `{}` |
| CompileError | `shell-inspector-width` | group | - | StringLiteral | 178:43-178:50 | `""` |
| Timeout | `shell-inspector-width` | value | - | StringLiteral | 178:59-178:66 | `""` |
| CompileError | `shell-main-max` | (whole record) | - | ObjectLiteral | 179:3-179:61 | `{}` |
| CompileError | `shell-main-max` | group | - | StringLiteral | 179:36-179:43 | `""` |
| CompileError | `shell-collapse-inspector` | (whole record) | - | ObjectLiteral | 180:3-180:71 | `{}` |
| CompileError | `shell-collapse-inspector` | group | - | StringLiteral | 180:46-180:53 | `""` |

#### `packages/tokens/src/source.ts:181-230` (11 Timeout, 50 CompileError)

| Status | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement |
|---|---|---|---|---|---|---|
| CompileError | `shell-collapse-sidebar` | (whole record) | - | ObjectLiteral | 181:3-181:69 | `{}` |
| CompileError | `shell-collapse-sidebar` | group | - | StringLiteral | 181:44-181:51 | `""` |
| Timeout | `shell-collapse-sidebar` | value | - | StringLiteral | 181:60-181:67 | `""` |
| CompileError | `shell-height` | (whole record) | - | ObjectLiteral | 182:3-182:60 | `{}` |
| CompileError | `shell-height` | group | - | StringLiteral | 182:34-182:41 | `""` |
| Timeout | `shell-height` | value | - | StringLiteral | 182:50-182:58 | `""` |
| CompileError | `footer-h` | (whole record) | - | ObjectLiteral | 183:3-183:56 | `{}` |
| CompileError | `footer-h` | group | - | StringLiteral | 183:30-183:37 | `""` |
| Timeout | `footer-h` | value | - | StringLiteral | 183:46-183:54 | `""` |
| CompileError | `measure-sheet` | (whole record) | - | ObjectLiteral | 184:3-184:108 | `{}` |
| CompileError | `measure-sheet` | group | - | StringLiteral | 184:35-184:42 | `""` |
| CompileError | `measure-sentence` | (whole record) | - | ObjectLiteral | 185:3-185:111 | `{}` |
| CompileError | `measure-sentence` | group | - | StringLiteral | 185:38-185:45 | `""` |
| CompileError | `measure-page` | (whole record) | - | ObjectLiteral | 186:3-186:58 | `{}` |
| CompileError | `measure-page` | group | - | StringLiteral | 186:34-186:41 | `""` |
| Timeout | `measure-page` | value | - | StringLiteral | 186:50-186:56 | `""` |
| CompileError | `measure-reading` | (whole record) | - | ObjectLiteral | 187:3-187:61 | `{}` |
| CompileError | `measure-reading` | group | - | StringLiteral | 187:37-187:44 | `""` |
| Timeout | `measure-reading` | value | - | StringLiteral | 187:53-187:59 | `""` |
| CompileError | `measure-cell` | (whole record) | - | ObjectLiteral | 188:3-188:58 | `{}` |
| CompileError | `measure-cell` | group | - | StringLiteral | 188:34-188:41 | `""` |
| Timeout | `measure-cell` | value | - | StringLiteral | 188:50-188:56 | `""` |
| CompileError | `measure-container` | (whole record) | - | ObjectLiteral | 190:3-190:65 | `{}` |
| CompileError | `measure-container` | group | - | StringLiteral | 190:39-190:46 | `""` |
| Timeout | `measure-container` | value | - | StringLiteral | 190:55-190:63 | `""` |
| CompileError | `dialog-max-inline` | (whole record) | - | ObjectLiteral | 192:3-192:114 | `{}` |
| CompileError | `dialog-max-inline` | group | - | StringLiteral | 192:39-192:46 | `""` |
| CompileError | `dialog-max-block` | (whole record) | - | ObjectLiteral | 194:3-194:114 | `{}` |
| CompileError | `dialog-max-block` | group | - | StringLiteral | 194:38-194:45 | `""` |
| CompileError | `bar-block-narrow` | (whole record) | - | ObjectLiteral | 196:3-196:152 | `{}` |
| CompileError | `bar-block-narrow` | group | - | StringLiteral | 196:38-196:45 | `""` |
| CompileError | `elevation-sheet` | (whole record) | - | ObjectLiteral | 200:3-205:4 | `{}` |
| CompileError | `elevation-sheet` | group | - | StringLiteral | 202:12-202:23 | `""` |
| CompileError | `elevation-sheet` | value | - | ObjectLiteral | 203:12-203:103 | `{}` |
| CompileError | `elevation-sheet` | ref | - | ObjectLiteral | 204:10-204:57 | `{}` |
| CompileError | `elevation-raised` | (whole record) | - | ObjectLiteral | 206:3-211:4 | `{}` |
| CompileError | `elevation-raised` | group | - | StringLiteral | 208:12-208:23 | `""` |
| CompileError | `elevation-raised` | value | - | ObjectLiteral | 209:12-209:140 | `{}` |
| Timeout | `elevation-raised` | value | light | StringLiteral | 209:21-209:87 | `""` |
| CompileError | `elevation-raised` | ref | - | ObjectLiteral | 210:10-210:52 | `{}` |
| CompileError | `elevation-row` | (whole record) | - | ObjectLiteral | 212:3-217:4 | `{}` |
| CompileError | `elevation-row` | group | - | StringLiteral | 214:12-214:23 | `""` |
| CompileError | `elevation-row` | value | - | ObjectLiteral | 215:12-215:155 | `{}` |
| CompileError | `elevation-row` | ref | - | ObjectLiteral | 216:10-216:77 | `{}` |
| CompileError | `elevation-seg` | (whole record) | - | ObjectLiteral | 218:3-223:4 | `{}` |
| CompileError | `elevation-seg` | group | - | StringLiteral | 220:12-220:23 | `""` |
| CompileError | `elevation-seg` | value | - | ObjectLiteral | 221:12-221:155 | `{}` |
| CompileError | `elevation-seg` | ref | - | ObjectLiteral | 222:10-222:77 | `{}` |
| CompileError | `elevation-bar` | (whole record) | - | ObjectLiteral | 224:3-224:116 | `{}` |
| CompileError | `elevation-bar` | name | - | StringLiteral | 224:11-224:26 | `""` |
| CompileError | `elevation-bar` | group | - | StringLiteral | 224:35-224:46 | `""` |
| CompileError | `elevation-bar` | value | - | ObjectLiteral | 224:55-224:114 | `{}` |
| Timeout | `elevation-bar` | value | light | StringLiteral | 224:64-224:98 | `""` |
| Timeout | `elevation-bar` | value | dark | StringLiteral | 224:106-224:112 | `""` |
| CompileError | `motion-fast` | (whole record) | - | ObjectLiteral | 225:3-225:59 | `{}` |
| CompileError | `motion-fast` | group | - | StringLiteral | 225:33-225:41 | `""` |
| Timeout | `motion-fast` | value | - | StringLiteral | 225:50-225:57 | `""` |
| CompileError | `motion-base` | (whole record) | - | ObjectLiteral | 226:3-226:59 | `{}` |
| CompileError | `motion-base` | group | - | StringLiteral | 226:33-226:41 | `""` |
| CompileError | `easing-standard` | (whole record) | - | ObjectLiteral | 227:3-227:88 | `{}` |
| CompileError | `easing-standard` | group | - | StringLiteral | 227:37-227:45 | `""` |

### Every Timeout of the checker-off runs, with its checker-on status

The checker-off runs are the configuration op 004 measured, so these 121 are the mutants op 004 recorded as Timeout
(spec FR-011), here with the status the red run (checker on) gave each. Entries `1-60` and `61-120` have none.

#### `packages/tokens/src/source.ts:121-180` (97 Timeout)

| Status (checker off) | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement | Status (checker on) |
|---|---|---|---|---|---|---|---|
| Timeout | `font-sans` | group | - | StringLiteral | 122:31-122:37 | `""` | CompileError |
| Timeout | `font-sans` | value | - | StringLiteral | 122:46-122:115 | `""` | Timeout |
| Timeout | `font-display` | group | - | StringLiteral | 123:34-123:40 | `""` | CompileError |
| Timeout | `figures` | group | - | StringLiteral | 124:29-124:35 | `""` | CompileError |
| Timeout | `figures` | value | - | StringLiteral | 124:44-124:58 | `""` | Timeout |
| Timeout | `font-size-xs` | group | - | StringLiteral | 125:34-125:40 | `""` | CompileError |
| Timeout | `font-size-xs` | value | - | StringLiteral | 125:49-125:58 | `""` | Timeout |
| Timeout | `font-size-sm` | group | - | StringLiteral | 126:34-126:40 | `""` | CompileError |
| Timeout | `font-size-sm` | value | - | StringLiteral | 126:49-126:59 | `""` | Timeout |
| Timeout | `font-size-md` | group | - | StringLiteral | 127:34-127:40 | `""` | CompileError |
| Timeout | `font-size-md` | value | - | StringLiteral | 127:49-127:55 | `""` | Timeout |
| Timeout | `font-size-fact` | group | - | StringLiteral | 128:36-128:42 | `""` | CompileError |
| Timeout | `font-size-fact` | value | - | StringLiteral | 128:51-128:62 | `""` | Timeout |
| Timeout | `font-size-subhead` | group | - | StringLiteral | 129:39-129:45 | `""` | CompileError |
| Timeout | `font-size-subhead` | value | - | StringLiteral | 129:54-129:64 | `""` | Timeout |
| Timeout | `font-size-lg` | group | - | StringLiteral | 130:34-130:40 | `""` | CompileError |
| Timeout | `font-size-lg` | value | - | StringLiteral | 130:49-130:58 | `""` | Timeout |
| Timeout | `font-size-xl` | group | - | StringLiteral | 131:34-131:40 | `""` | CompileError |
| Timeout | `font-size-xl` | value | - | StringLiteral | 131:49-131:57 | `""` | Timeout |
| Timeout | `font-size-2xl` | group | - | StringLiteral | 132:35-132:41 | `""` | CompileError |
| Timeout | `font-size-2xl` | value | - | StringLiteral | 132:50-132:60 | `""` | Timeout |
| Timeout | `line-height-tight` | group | - | StringLiteral | 133:39-133:45 | `""` | CompileError |
| Timeout | `line-height-tight` | value | - | StringLiteral | 133:54-133:60 | `""` | Timeout |
| Timeout | `line-height-normal` | group | - | StringLiteral | 134:40-134:46 | `""` | CompileError |
| Timeout | `line-height-normal` | value | - | StringLiteral | 134:55-134:61 | `""` | Timeout |
| Timeout | `line-height-relaxed` | group | - | StringLiteral | 135:41-135:47 | `""` | CompileError |
| Timeout | `line-height-relaxed` | value | - | StringLiteral | 135:56-135:62 | `""` | Timeout |
| Timeout | `line-height-compact` | group | - | StringLiteral | 136:41-136:47 | `""` | CompileError |
| Timeout | `line-height-compact` | value | - | StringLiteral | 136:56-136:61 | `""` | Timeout |
| Timeout | `line-height-prose` | group | - | StringLiteral | 137:39-137:45 | `""` | CompileError |
| Timeout | `line-height-prose` | value | - | StringLiteral | 137:54-137:60 | `""` | Timeout |
| Timeout | `font-weight-regular` | group | - | StringLiteral | 138:41-138:47 | `""` | CompileError |
| Timeout | `font-weight-regular` | value | - | StringLiteral | 138:56-138:61 | `""` | Timeout |
| Timeout | `font-weight-medium` | group | - | StringLiteral | 139:40-139:46 | `""` | CompileError |
| Timeout | `font-weight-medium` | value | - | StringLiteral | 139:55-139:60 | `""` | Timeout |
| Timeout | `font-weight-strong` | group | - | StringLiteral | 140:40-140:46 | `""` | CompileError |
| Timeout | `font-weight-strong` | value | - | StringLiteral | 140:55-140:60 | `""` | Timeout |
| Timeout | `font-weight-display` | group | - | StringLiteral | 141:41-141:47 | `""` | CompileError |
| Timeout | `font-weight-display` | value | - | StringLiteral | 141:56-141:61 | `""` | Timeout |
| Timeout | `tracking-display` | group | - | StringLiteral | 142:38-142:44 | `""` | CompileError |
| Timeout | `tracking-display` | value | - | StringLiteral | 142:53-142:62 | `""` | Timeout |
| Timeout | `space-1` | group | - | StringLiteral | 145:29-145:36 | `""` | CompileError |
| Timeout | `space-1` | value | - | StringLiteral | 145:45-145:54 | `""` | Timeout |
| Timeout | `space-2` | group | - | StringLiteral | 146:29-146:36 | `""` | CompileError |
| Timeout | `space-2` | value | - | StringLiteral | 146:45-146:53 | `""` | Timeout |
| Timeout | `space-3` | group | - | StringLiteral | 147:29-147:36 | `""` | CompileError |
| Timeout | `space-3` | value | - | StringLiteral | 147:45-147:54 | `""` | Timeout |
| Timeout | `space-4` | group | - | StringLiteral | 148:29-148:36 | `""` | CompileError |
| Timeout | `space-4` | value | - | StringLiteral | 148:45-148:51 | `""` | Timeout |
| Timeout | `space-5` | group | - | StringLiteral | 149:29-149:36 | `""` | CompileError |
| Timeout | `space-5` | value | - | StringLiteral | 149:45-149:54 | `""` | Timeout |
| Timeout | `space-6` | group | - | StringLiteral | 150:29-150:36 | `""` | CompileError |
| Timeout | `space-6` | value | - | StringLiteral | 150:45-150:53 | `""` | Timeout |
| Timeout | `space-7` | group | - | StringLiteral | 151:29-151:36 | `""` | CompileError |
| Timeout | `space-7` | value | - | StringLiteral | 151:45-151:51 | `""` | Timeout |
| Timeout | `space-8` | group | - | StringLiteral | 152:29-152:36 | `""` | CompileError |
| Timeout | `space-8` | value | - | StringLiteral | 152:45-152:53 | `""` | Timeout |
| Timeout | `space-9` | group | - | StringLiteral | 153:29-153:36 | `""` | CompileError |
| Timeout | `space-9` | value | - | StringLiteral | 153:45-153:51 | `""` | Timeout |
| Timeout | `space-10` | group | - | StringLiteral | 154:30-154:37 | `""` | CompileError |
| Timeout | `space-10` | value | - | StringLiteral | 154:46-154:52 | `""` | Timeout |
| Timeout | `gutter` | group | - | StringLiteral | 155:28-155:35 | `""` | CompileError |
| Timeout | `radius-1` | group | - | StringLiteral | 156:30-156:37 | `""` | CompileError |
| Timeout | `radius-2` | group | - | StringLiteral | 157:30-157:37 | `""` | CompileError |
| Timeout | `radius-row` | group | - | StringLiteral | 158:32-158:39 | `""` | CompileError |
| Timeout | `radius-shell` | group | - | StringLiteral | 159:34-159:41 | `""` | CompileError |
| Timeout | `radius-pill` | group | - | StringLiteral | 160:33-160:40 | `""` | CompileError |
| Timeout | `border-width` | group | - | StringLiteral | 161:34-161:41 | `""` | CompileError |
| Timeout | `border-width` | value | - | StringLiteral | 161:50-161:55 | `""` | Timeout |
| Timeout | `focus-width` | group | - | StringLiteral | 162:33-162:40 | `""` | CompileError |
| Timeout | `focus-width` | value | - | StringLiteral | 162:49-162:54 | `""` | Timeout |
| Timeout | `focus-offset` | group | - | StringLiteral | 163:34-163:41 | `""` | CompileError |
| Timeout | `focus-offset` | value | - | StringLiteral | 163:50-163:55 | `""` | Timeout |
| Timeout | `bar-width` | group | - | StringLiteral | 164:31-164:38 | `""` | CompileError |
| Timeout | `bar-width` | value | - | StringLiteral | 164:47-164:52 | `""` | Timeout |
| Timeout | `ring-step` | group | - | StringLiteral | 165:31-165:38 | `""` | CompileError |
| Timeout | `ring-step` | value | - | StringLiteral | 165:47-165:54 | `""` | Timeout |
| Timeout | `target-min` | group | - | StringLiteral | 166:32-166:38 | `""` | CompileError |
| Timeout | `target-min` | value | - | StringLiteral | 166:47-166:56 | `""` | Timeout |
| Timeout | `icon-size` | group | - | StringLiteral | 167:31-167:37 | `""` | CompileError |
| Timeout | `icon-size` | value | - | StringLiteral | 167:46-167:55 | `""` | Timeout |
| Timeout | `size-dot` | group | - | StringLiteral | 168:30-168:36 | `""` | CompileError |
| Timeout | `size-dot` | value | - | StringLiteral | 168:45-168:54 | `""` | Timeout |
| Timeout | `size-step` | group | - | StringLiteral | 169:31-169:37 | `""` | CompileError |
| Timeout | `size-step` | value | - | StringLiteral | 169:46-169:54 | `""` | Timeout |
| Timeout | `size-avatar` | group | - | StringLiteral | 170:33-170:39 | `""` | CompileError |
| Timeout | `size-avatar` | value | - | StringLiteral | 170:48-170:56 | `""` | Timeout |
| Timeout | `size-rail-item` | group | - | StringLiteral | 171:36-171:42 | `""` | CompileError |
| Timeout | `size-rail-item` | value | - | StringLiteral | 171:51-171:59 | `""` | Timeout |
| Timeout | `size-visually-hidden` | group | - | StringLiteral | 172:42-172:48 | `""` | CompileError |
| Timeout | `size-visually-hidden` | value | - | StringLiteral | 172:57-172:62 | `""` | Timeout |
| Timeout | `shell-topbar-height` | group | - | StringLiteral | 175:41-175:48 | `""` | CompileError |
| Timeout | `shell-topbar-height` | value | - | StringLiteral | 175:57-175:66 | `""` | Timeout |
| Timeout | `shell-rail-width` | group | - | StringLiteral | 176:38-176:45 | `""` | CompileError |
| Timeout | `shell-rail-width` | value | - | StringLiteral | 176:54-176:63 | `""` | Timeout |
| Timeout | `shell-sidebar-width` | group | - | StringLiteral | 177:41-177:48 | `""` | CompileError |
| Timeout | `shell-sidebar-width` | value | - | StringLiteral | 177:57-177:64 | `""` | Timeout |

#### `packages/tokens/src/source.ts:181-230` (24 Timeout)

| Status (checker off) | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement | Status (checker on) |
|---|---|---|---|---|---|---|---|
| Timeout | `shell-collapse-sidebar` | group | - | StringLiteral | 181:44-181:51 | `""` | CompileError |
| Timeout | `shell-collapse-sidebar` | value | - | StringLiteral | 181:60-181:67 | `""` | Timeout |
| Timeout | `shell-height` | group | - | StringLiteral | 182:34-182:41 | `""` | CompileError |
| Timeout | `shell-height` | value | - | StringLiteral | 182:50-182:58 | `""` | Timeout |
| Timeout | `footer-h` | group | - | StringLiteral | 183:30-183:37 | `""` | CompileError |
| Timeout | `footer-h` | value | - | StringLiteral | 183:46-183:54 | `""` | Timeout |
| Timeout | `measure-sheet` | group | - | StringLiteral | 184:35-184:42 | `""` | CompileError |
| Timeout | `measure-sentence` | group | - | StringLiteral | 185:38-185:45 | `""` | CompileError |
| Timeout | `measure-page` | group | - | StringLiteral | 186:34-186:41 | `""` | CompileError |
| Timeout | `measure-page` | value | - | StringLiteral | 186:50-186:56 | `""` | Timeout |
| Timeout | `measure-reading` | group | - | StringLiteral | 187:37-187:44 | `""` | CompileError |
| Timeout | `measure-reading` | value | - | StringLiteral | 187:53-187:59 | `""` | Timeout |
| Timeout | `measure-cell` | group | - | StringLiteral | 188:34-188:41 | `""` | CompileError |
| Timeout | `measure-cell` | value | - | StringLiteral | 188:50-188:56 | `""` | Timeout |
| Timeout | `measure-container` | group | - | StringLiteral | 190:39-190:46 | `""` | CompileError |
| Timeout | `measure-container` | value | - | StringLiteral | 190:55-190:63 | `""` | Timeout |
| Timeout | `dialog-max-inline` | group | - | StringLiteral | 192:39-192:46 | `""` | CompileError |
| Timeout | `dialog-max-block` | group | - | StringLiteral | 194:38-194:45 | `""` | CompileError |
| Timeout | `bar-block-narrow` | group | - | StringLiteral | 196:38-196:45 | `""` | CompileError |
| Timeout | `elevation-raised` | value | light | StringLiteral | 209:21-209:87 | `""` | Timeout |
| Timeout | `elevation-bar` | value | light | StringLiteral | 224:64-224:98 | `""` | Timeout |
| Timeout | `elevation-bar` | value | dark | StringLiteral | 224:106-224:112 | `""` | Timeout |
| Timeout | `motion-fast` | group | - | StringLiteral | 225:33-225:41 | `""` | CompileError |
| Timeout | `motion-fast` | value | - | StringLiteral | 225:50-225:57 | `""` | Timeout |

### The FR-013 reference entries' Timeouts and CompileErrors (checker on)

#### `packages/tokens/src/generate.ts:1-60` (0 Timeout, 4 CompileError)

| Status | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement |
|---|---|---|---|---|---|---|
| CompileError | `-` | const themes | - | StringLiteral | 58:35-58:42 | `""` |
| CompileError | `-` | const themes | - | StringLiteral | 58:44-58:50 | `""` |
| CompileError | `-` | const themedGroups | - | StringLiteral | 60:51-60:59 | `""` |
| CompileError | `-` | const themedGroups | - | StringLiteral | 60:61-60:72 | `""` |

#### `gates/lib/wcag.ts` (2 Timeout, 3 CompileError)

| Status | Record | Field | Theme | Mutator | Start-end (line:column) | Replacement |
|---|---|---|---|---|---|---|
| Timeout | `-` | const hex | - | Regex | 4:13-4:66 | `/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})/` |
| Timeout | `-` | const hex | - | Regex | 4:13-4:66 | `/#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/` |
| CompileError | `-` | function linear | - | BlockStatement | 7:42-11:2 | `{}` |
| CompileError | `-` | function relativeLuminance | - | BlockStatement | 14:59-19:2 | `{}` |
| CompileError | `-` | function contrastRatio | - | BlockStatement | 22:79-26:2 | `{}` |


## Green measurement with lever 1 (phase 3, spec FR-009 to FR-013, research R-05, R-06)

Taken on 2026-11-11 on the same sandbox (4 cores, Node 22.23.4, Stryker 10.1.1), with the same environment, base
`B = eaf16896ec10affdca24296fc9531fcffc46a8be` and command as the red runs (wall time by `date +%s.%N` around the
command, `time.txt`: seconds, then the gate's exit code). The configuration is lever 1 (T021, commit `3986b74`):
`vitest.mutation.config.ts` splits `tokens` into `tokens-source-table` (`source-table.test.ts`, `groupOrder: 1`) and
`tokens` (`groupOrder: 2`), every other mutation project at `groupOrder: 3`; `stryker.config.json` is unchanged
(`concurrency: 8`, the TypeScript checker on). The gate is the User Story 1 gate, so each run prints its report lines.
One run at a time, nothing else heavy beside it. *Note, 2026-11-11 (fix round 2, landing L1-01):* this order was
narrowed afterwards: only `tokens-source-table` stays at 1, every other project, the rest of `tokens` included, is at
2; see § Fix round 2 below. The runs of this section were taken with the order stated here.

**A discarded first attempt.** The first green run of `source.ts:1-60` ended exit 2 after 30.57 s: `mutation: could
not run: Stryker wrote no report (There were failed tests in the initial test run.)`. Stryker's dry run failed on
`gates/test/vitest-config.test.ts` "excludes exactly tokens-browser, …", a unit test of the `gates` project that held
the same deep-equal of the mutation projects as the integration test T019 replaced (tasks.md names only the latter).
It was updated to the split (commit `9f56827`, the reason in its body), `pnpm test` passed, and the run was taken
again; the failed attempt's files were not kept.

**Folders.** `green/source-1-60`, `green/source-61-120`, `green/source-121-180`, `green/source-181-230`,
`green/generate-1-60`, `green/wcag`; the checker split of each entry over 176 s under `green/<entry-slug>/no-checker/`
(T023); lever 2 under `lever2/` (T028).

### Green table (T023)

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Ignored | Time (red) | Time (green) | Checker split (diagnostic, not the checker's share): checker off / difference | Within 176 s |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `source.ts:1-60` | 135 | 70 | 0 | 0 | 0 | 65 | 0 | 227.08 s | 188.37 s | 72.24 s / 116.13 s | **no** |
| `source.ts:61-120` | 202 | 103 | 0 | 0 | 0 | 99 | 0 | 285.43 s | 251.13 s | 94.81 s / 156.32 s | **no** |
| `source.ts:121-180` | 224 | 113 | 0 | 0 | 0 | 111 | 0 | 537.27 s | 283.22 s | 76.87 s / 206.35 s | **no** |
| `source.ts:181-230` | 120 | 70 | 0 | 0 | 0 | 50 | 0 | 259.26 s | 170.54 s | - (within 176 s) | yes |
| `generate.ts:1-60` (FR-013 reference) | 7 | 3 | 0 | 0 | 0 | 4 | 0 | 78.11 s | 59.51 s | - | yes |
| `gates/lib/wcag.ts` (FR-013 reference) | 33 | 26 | 2 | 0 | 0 | 3 | 2 | 90.92 s | 90.92 s | - | yes |

Every green run ended exit 0. The gate's summaries: `source.ts` entries `mutation: 135` / `202` / `224` / `120 mutants
on the changed lines of 1 file, none survived; 0 timeouts, 65` / `99` / `111` / `50 compile errors, 0 zero-mutant
entries; 0 equivalent records`; `generate.ts:1-60` `7 mutants …; 0 timeouts, 4 compile errors, …`; `wcag.ts` `33
mutants …; 2 timeouts, 3 compile errors, 0 zero-mutant entries; 1 equivalent record`, with its two `timeout` lines
(`gates/lib/wcag.ts:4`) and three `compile-error` lines. The `wcag.ts` time equals the red run's to the hundredth
(90.92 s); it is a new run (its `mutation.json` differs from the red copy in timings and test ids), the equality is a
coincidence of the two decimals.

*Note, 2026-11-11 (fix round 2, landing L1-01):* the two FR-013 reference rows above measure only `generate.ts:1-60`
and `wcag.ts`, so they could not show the Killed → Timeout moves of gate-source static mutants that landing L1-01
found with this order. The FR-013 check on gate source and the reference entries with the narrowed order are in
§ Fix round 2 below.

The checker-off runs of lever 1: 135, 202 and 224 Killed, 0 Timeout, 0 CompileError each.

**Killed by** (test file of each `killedBy` id, green, checker on): `1-60`: 44 `packages/tokens/test/source-table.test.ts`,
25 `packages/tokens/test/validate.test.ts`, 1 `gates/test/contrast.test.ts`; `61-120`: 79 `source-table.test.ts`, 13
`validate.test.ts`, 11 `contrast.test.ts`; `121-180`: 108 `source-table.test.ts`, 5 `validate.test.ts`; `181-230`: 70
`source-table.test.ts`. `testsCompleted` of the Killed mutants: 4 to 141 in `1-60` and `61-120` (the contrast-killed
mutants run every token test first, research R-05 *Cost for `source.ts` itself*), 4 to 10 in `121-180` and `181-230`.

### Per-mutant comparisons, red against green (T024)

The script is `evidence/compare.mjs` (`node evidence/compare.mjs <red mutation.json> <green mutation.json> <path>`):
it keys each mutant of `<path>` by start and end (line:column), mutator and replacement, exits 1 naming the key on a
key repeated within one run's file or present in only one run, and otherwise prints every status move with its count,
then each mutant whose status changed (for a Killed → Timeout move with its red `killedBy` and green
`testsCompleted`). Run from the repository root; the commands and their output verbatim:

```text
$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-1-60/mutation.json specs/007-mutation-gate-strictness/evidence/green/source-1-60/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 135 mutants in both runs, every key once
move CompileError -> CompileError: 65
move Killed -> Killed: 70
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-61-120/mutation.json specs/007-mutation-gate-strictness/evidence/green/source-61-120/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 202 mutants in both runs, every key once
move CompileError -> CompileError: 99
move Killed -> Killed: 103
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-121-180/mutation.json specs/007-mutation-gate-strictness/evidence/green/source-121-180/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 224 mutants in both runs, every key once
move CompileError -> CompileError: 111
move Killed -> Killed: 67
move Timeout -> Killed: 46
changed 122:46-122:115 StringLiteral "\"\"": Timeout -> Killed
changed 124:44-124:58 StringLiteral "\"\"": Timeout -> Killed
changed 125:49-125:58 StringLiteral "\"\"": Timeout -> Killed
changed 126:49-126:59 StringLiteral "\"\"": Timeout -> Killed
changed 127:49-127:55 StringLiteral "\"\"": Timeout -> Killed
changed 128:51-128:62 StringLiteral "\"\"": Timeout -> Killed
changed 129:54-129:64 StringLiteral "\"\"": Timeout -> Killed
changed 130:49-130:58 StringLiteral "\"\"": Timeout -> Killed
changed 131:49-131:57 StringLiteral "\"\"": Timeout -> Killed
changed 132:50-132:60 StringLiteral "\"\"": Timeout -> Killed
changed 133:54-133:60 StringLiteral "\"\"": Timeout -> Killed
changed 134:55-134:61 StringLiteral "\"\"": Timeout -> Killed
changed 135:56-135:62 StringLiteral "\"\"": Timeout -> Killed
changed 136:56-136:61 StringLiteral "\"\"": Timeout -> Killed
changed 137:54-137:60 StringLiteral "\"\"": Timeout -> Killed
changed 138:56-138:61 StringLiteral "\"\"": Timeout -> Killed
changed 139:55-139:60 StringLiteral "\"\"": Timeout -> Killed
changed 140:55-140:60 StringLiteral "\"\"": Timeout -> Killed
changed 141:56-141:61 StringLiteral "\"\"": Timeout -> Killed
changed 142:53-142:62 StringLiteral "\"\"": Timeout -> Killed
changed 145:45-145:54 StringLiteral "\"\"": Timeout -> Killed
changed 146:45-146:53 StringLiteral "\"\"": Timeout -> Killed
changed 147:45-147:54 StringLiteral "\"\"": Timeout -> Killed
changed 148:45-148:51 StringLiteral "\"\"": Timeout -> Killed
changed 149:45-149:54 StringLiteral "\"\"": Timeout -> Killed
changed 150:45-150:53 StringLiteral "\"\"": Timeout -> Killed
changed 151:45-151:51 StringLiteral "\"\"": Timeout -> Killed
changed 152:45-152:53 StringLiteral "\"\"": Timeout -> Killed
changed 153:45-153:51 StringLiteral "\"\"": Timeout -> Killed
changed 154:46-154:52 StringLiteral "\"\"": Timeout -> Killed
changed 161:50-161:55 StringLiteral "\"\"": Timeout -> Killed
changed 162:49-162:54 StringLiteral "\"\"": Timeout -> Killed
changed 163:50-163:55 StringLiteral "\"\"": Timeout -> Killed
changed 164:47-164:52 StringLiteral "\"\"": Timeout -> Killed
changed 165:47-165:54 StringLiteral "\"\"": Timeout -> Killed
changed 166:47-166:56 StringLiteral "\"\"": Timeout -> Killed
changed 167:46-167:55 StringLiteral "\"\"": Timeout -> Killed
changed 168:45-168:54 StringLiteral "\"\"": Timeout -> Killed
changed 169:46-169:54 StringLiteral "\"\"": Timeout -> Killed
changed 170:48-170:56 StringLiteral "\"\"": Timeout -> Killed
changed 171:51-171:59 StringLiteral "\"\"": Timeout -> Killed
changed 172:57-172:62 StringLiteral "\"\"": Timeout -> Killed
changed 175:57-175:66 StringLiteral "\"\"": Timeout -> Killed
changed 176:54-176:63 StringLiteral "\"\"": Timeout -> Killed
changed 177:57-177:64 StringLiteral "\"\"": Timeout -> Killed
changed 178:59-178:66 StringLiteral "\"\"": Timeout -> Killed
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-181-230/mutation.json specs/007-mutation-gate-strictness/evidence/green/source-181-230/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 120 mutants in both runs, every key once
move CompileError -> CompileError: 50
move Killed -> Killed: 59
move Timeout -> Killed: 11
changed 181:60-181:67 StringLiteral "\"\"": Timeout -> Killed
changed 182:50-182:58 StringLiteral "\"\"": Timeout -> Killed
changed 183:46-183:54 StringLiteral "\"\"": Timeout -> Killed
changed 186:50-186:56 StringLiteral "\"\"": Timeout -> Killed
changed 187:53-187:59 StringLiteral "\"\"": Timeout -> Killed
changed 188:50-188:56 StringLiteral "\"\"": Timeout -> Killed
changed 190:55-190:63 StringLiteral "\"\"": Timeout -> Killed
changed 209:21-209:87 StringLiteral "\"\"": Timeout -> Killed
changed 224:64-224:98 StringLiteral "\"\"": Timeout -> Killed
changed 224:106-224:112 StringLiteral "\"\"": Timeout -> Killed
changed 225:50-225:57 StringLiteral "\"\"": Timeout -> Killed
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/generate-1-60/mutation.json specs/007-mutation-gate-strictness/evidence/green/generate-1-60/mutation.json packages/tokens/src/generate.ts
packages/tokens/src/generate.ts: 7 mutants in both runs, every key once
move CompileError -> CompileError: 4
move Killed -> Killed: 3
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/wcag/mutation.json specs/007-mutation-gate-strictness/evidence/green/wcag/mutation.json gates/lib/wcag.ts
gates/lib/wcag.ts: 33 mutants in both runs, every key once
move CompileError -> CompileError: 3
move Ignored -> Ignored: 2
move Killed -> Killed: 26
move Timeout -> Timeout: 2
(exit 0)
```

So: no key repeats and every key is in both runs, in all six comparisons. No mutant moved Killed → Timeout, Survived
or NoCoverage in any entry, so no re-run was due (research R-06). The reference entries keep every status and every
count (`generate.ts:1-60`: 3 Killed, 4 CompileError; `wcag.ts`: 26 Killed, 2 Timeout, 3 CompileError, 2 Ignored) and
neither is slower (78.11 s → 59.51 s; 90.92 s → 90.92 s). The `source.ts` entries' only moves are the 57 Timeouts of
the red run, all to Killed.

### FR-011 record (T025)

Every mutant the phase-1 runs (T003) recorded as Timeout: the 121 of the checker-off runs (op 004's Timeouts, research
R-06 *Every Timeout of the checker-off runs*) and the 57 of the red run as configured, 122 mutants in all
(`shell-inspector-width`'s value, `178:59-178:66`, is a Timeout only of the run as configured). Record, field, theme
and mutator as read in phase 1 (*How the record, field and theme were read*), matched to the green report by start and
end, mutator and replacement. For each Killed mutant the three criteria of research R-06 were checked and are noted
per row: (1) every `killedBy` test is under `packages/tokens/test/` (the `tokens-source-table` or `tokens` project);
(2) `statusReason` is an `expect` mismatch, read only for its kind: Vitest's assertion message `expected … to deeply
equal …`, not an error at load or setup; (3) every `killedBy` test is one of the three named tests of
`source-table.test.ts` (light values `:39`, dark values `:45`, JSON groups and values `:76`). `statusReason` is
recorded as given; Vitest truncates it to the first key, so it names no record (research R-06), and message text is
never a criterion. A CompileError is allowed only where the red run as configured already recorded that mutant as
CompileError.

Result: 122 of 122 meet FR-011. 57 end Killed, each by `source-table.test.ts` (56 by the light-value test, 1, the
dark value of `elevation-bar`, by the dark-value test), each with an `expect` mismatch, after 5 or 6 completed tests;
65 (op 004 group A, `group` → `""`) end CompileError, as in the red run as configured. No group A mutant ends Killed.
#### `packages/tokens/src/source.ts:121-180` (98 mutants: 97 op 004 Timeouts (red, checker off), 46 Timeouts of the red run as configured)

| Record | Field | Theme | Mutator | Start-end | Replacement | Red, checker off (op 004) | Red | Green | killedBy (green) | statusReason (green, as given) | testsCompleted (green) | (1) token test | (2) `expect` mismatch | (3) named test | FR-011 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `font-sans` | group | - | StringLiteral | 122:31-122:37 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-sans` | value | - | StringLiteral | 122:46-122:115 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-display` | group | - | StringLiteral | 123:34-123:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `figures` | group | - | StringLiteral | 124:29-124:35 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `figures` | value | - | StringLiteral | 124:44-124:58 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-xs` | group | - | StringLiteral | 125:34-125:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-xs` | value | - | StringLiteral | 125:49-125:58 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-sm` | group | - | StringLiteral | 126:34-126:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-sm` | value | - | StringLiteral | 126:49-126:59 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-md` | group | - | StringLiteral | 127:34-127:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-md` | value | - | StringLiteral | 127:49-127:55 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-fact` | group | - | StringLiteral | 128:36-128:42 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-fact` | value | - | StringLiteral | 128:51-128:62 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-subhead` | group | - | StringLiteral | 129:39-129:45 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-subhead` | value | - | StringLiteral | 129:54-129:64 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-lg` | group | - | StringLiteral | 130:34-130:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-lg` | value | - | StringLiteral | 130:49-130:58 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-xl` | group | - | StringLiteral | 131:34-131:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-xl` | value | - | StringLiteral | 131:49-131:57 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-size-2xl` | group | - | StringLiteral | 132:35-132:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-size-2xl` | value | - | StringLiteral | 132:50-132:60 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `line-height-tight` | group | - | StringLiteral | 133:39-133:45 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `line-height-tight` | value | - | StringLiteral | 133:54-133:60 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `line-height-normal` | group | - | StringLiteral | 134:40-134:46 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `line-height-normal` | value | - | StringLiteral | 134:55-134:61 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `line-height-relaxed` | group | - | StringLiteral | 135:41-135:47 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `line-height-relaxed` | value | - | StringLiteral | 135:56-135:62 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `line-height-compact` | group | - | StringLiteral | 136:41-136:47 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `line-height-compact` | value | - | StringLiteral | 136:56-136:61 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `line-height-prose` | group | - | StringLiteral | 137:39-137:45 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `line-height-prose` | value | - | StringLiteral | 137:54-137:60 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-weight-regular` | group | - | StringLiteral | 138:41-138:47 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-weight-regular` | value | - | StringLiteral | 138:56-138:61 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-weight-medium` | group | - | StringLiteral | 139:40-139:46 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-weight-medium` | value | - | StringLiteral | 139:55-139:60 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-weight-strong` | group | - | StringLiteral | 140:40-140:46 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-weight-strong` | value | - | StringLiteral | 140:55-140:60 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `font-weight-display` | group | - | StringLiteral | 141:41-141:47 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `font-weight-display` | value | - | StringLiteral | 141:56-141:61 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `tracking-display` | group | - | StringLiteral | 142:38-142:44 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `tracking-display` | value | - | StringLiteral | 142:53-142:62 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-1` | group | - | StringLiteral | 145:29-145:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-1` | value | - | StringLiteral | 145:45-145:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-2` | group | - | StringLiteral | 146:29-146:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-2` | value | - | StringLiteral | 146:45-146:53 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-3` | group | - | StringLiteral | 147:29-147:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-3` | value | - | StringLiteral | 147:45-147:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-4` | group | - | StringLiteral | 148:29-148:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-4` | value | - | StringLiteral | 148:45-148:51 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-5` | group | - | StringLiteral | 149:29-149:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-5` | value | - | StringLiteral | 149:45-149:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-6` | group | - | StringLiteral | 150:29-150:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-6` | value | - | StringLiteral | 150:45-150:53 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-7` | group | - | StringLiteral | 151:29-151:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-7` | value | - | StringLiteral | 151:45-151:51 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-8` | group | - | StringLiteral | 152:29-152:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-8` | value | - | StringLiteral | 152:45-152:53 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-9` | group | - | StringLiteral | 153:29-153:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-9` | value | - | StringLiteral | 153:45-153:51 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `space-10` | group | - | StringLiteral | 154:30-154:37 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `space-10` | value | - | StringLiteral | 154:46-154:52 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `gutter` | group | - | StringLiteral | 155:28-155:35 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `radius-1` | group | - | StringLiteral | 156:30-156:37 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `radius-2` | group | - | StringLiteral | 157:30-157:37 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `radius-row` | group | - | StringLiteral | 158:32-158:39 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `radius-shell` | group | - | StringLiteral | 159:34-159:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `radius-pill` | group | - | StringLiteral | 160:33-160:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `border-width` | group | - | StringLiteral | 161:34-161:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `border-width` | value | - | StringLiteral | 161:50-161:55 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `focus-width` | group | - | StringLiteral | 162:33-162:40 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `focus-width` | value | - | StringLiteral | 162:49-162:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `focus-offset` | group | - | StringLiteral | 163:34-163:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `focus-offset` | value | - | StringLiteral | 163:50-163:55 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `bar-width` | group | - | StringLiteral | 164:31-164:38 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `bar-width` | value | - | StringLiteral | 164:47-164:52 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `ring-step` | group | - | StringLiteral | 165:31-165:38 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `ring-step` | value | - | StringLiteral | 165:47-165:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `target-min` | group | - | StringLiteral | 166:32-166:38 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `target-min` | value | - | StringLiteral | 166:47-166:56 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `icon-size` | group | - | StringLiteral | 167:31-167:37 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `icon-size` | value | - | StringLiteral | 167:46-167:55 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `size-dot` | group | - | StringLiteral | 168:30-168:36 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `size-dot` | value | - | StringLiteral | 168:45-168:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `size-step` | group | - | StringLiteral | 169:31-169:37 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `size-step` | value | - | StringLiteral | 169:46-169:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `size-avatar` | group | - | StringLiteral | 170:33-170:39 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `size-avatar` | value | - | StringLiteral | 170:48-170:56 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `size-rail-item` | group | - | StringLiteral | 171:36-171:42 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `size-rail-item` | value | - | StringLiteral | 171:51-171:59 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `size-visually-hidden` | group | - | StringLiteral | 172:42-172:48 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `size-visually-hidden` | value | - | StringLiteral | 172:57-172:62 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `shell-topbar-height` | group | - | StringLiteral | 175:41-175:48 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `shell-topbar-height` | value | - | StringLiteral | 175:57-175:66 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `shell-rail-width` | group | - | StringLiteral | 176:38-176:45 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `shell-rail-width` | value | - | StringLiteral | 176:54-176:63 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `shell-sidebar-width` | group | - | StringLiteral | 177:41-177:48 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `shell-sidebar-width` | value | - | StringLiteral | 177:57-177:64 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `shell-inspector-width` | value | - | StringLiteral | 178:59-178:66 | `""` | Killed | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |

#### `packages/tokens/src/source.ts:181-230` (24 mutants: 24 op 004 Timeouts (red, checker off), 11 Timeouts of the red run as configured)

| Record | Field | Theme | Mutator | Start-end | Replacement | Red, checker off (op 004) | Red | Green | killedBy (green) | statusReason (green, as given) | testsCompleted (green) | (1) token test | (2) `expect` mismatch | (3) named test | FR-011 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `shell-collapse-sidebar` | group | - | StringLiteral | 181:44-181:51 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `shell-collapse-sidebar` | value | - | StringLiteral | 181:60-181:67 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `shell-height` | group | - | StringLiteral | 182:34-182:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `shell-height` | value | - | StringLiteral | 182:50-182:58 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `footer-h` | group | - | StringLiteral | 183:30-183:37 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `footer-h` | value | - | StringLiteral | 183:46-183:54 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `measure-sheet` | group | - | StringLiteral | 184:35-184:42 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `measure-sentence` | group | - | StringLiteral | 185:38-185:45 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `measure-page` | group | - | StringLiteral | 186:34-186:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `measure-page` | value | - | StringLiteral | 186:50-186:56 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `measure-reading` | group | - | StringLiteral | 187:37-187:44 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `measure-reading` | value | - | StringLiteral | 187:53-187:59 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `measure-cell` | group | - | StringLiteral | 188:34-188:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `measure-cell` | value | - | StringLiteral | 188:50-188:56 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `measure-container` | group | - | StringLiteral | 190:39-190:46 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `measure-container` | value | - | StringLiteral | 190:55-190:63 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `dialog-max-inline` | group | - | StringLiteral | 192:39-192:46 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `dialog-max-block` | group | - | StringLiteral | 194:38-194:45 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `bar-block-narrow` | group | - | StringLiteral | 196:38-196:45 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `elevation-raised` | value | light | StringLiteral | 209:21-209:87 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `elevation-bar` | value | light | StringLiteral | 224:64-224:98 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |
| `elevation-bar` | value | dark | StringLiteral | 224:106-224:112 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each theme-dependent token's dark value under both dark selectors, where it differs from light" | `expected { 'color-canvas': '#15130f', …(44) } to deeply equal { 'color-canvas': '#15130f', …(44) }` | 6 | yes | yes | yes | met (Killed) |
| `motion-fast` | group | - | StringLiteral | 225:33-225:41 | `""` | Timeout | CompileError | CompileError | - | - | - | - | - | - | met (CompileError, red CompileError) |
| `motion-fast` | value | - | StringLiteral | 225:50-225:57 | `""` | Timeout | Timeout | Killed | `source-table.test.ts` "declares each token's light value (or its one value) in the unconditioned :root block" | `expected { 'color-canvas': '#f1eee8', …(114) } to deeply equal { 'color-canvas': '#f1eee8', …(114) }` | 5 | yes | yes | yes | met (Killed) |

### By hand (T026, spec US2 AS4)

One Killed mutant of each group that has one, applied to `packages/tokens/src/source.ts` in the working tree, the
token tests run with `pnpm exec vitest run --config vitest.mutation.config.ts --project tokens-source-table --project
tokens`, the output kept, and the file restored with `git checkout -- packages/tokens/src/source.ts`:

- `by-hand/group-B.txt`: `font-sans` value, StringLiteral `122:46-122:115` → `""`. Exit 1, 2 failed of 137; the
  light-value test's diff names the key: `- "font-sans": "\"Schibsted Grotesk\", …"` / `+ "font-sans": " "`.
- `by-hand/group-C.txt`: `elevation-bar` dark value, StringLiteral `224:106-224:112` → `""`. Exit 1, 2 failed of 137;
  the dark-value test's diff names the key: `- "elevation-bar": "none"` / `+ "elevation-bar": " "`.
- Group A: no mutant ends Killed (all 65 CompileError), so none is applied by hand (spec FR-011).

### Decision on lever 2 (T027)

From the figures above alone (FR-010): every `source.ts` entry has 0 Timeout, 0 Survived and 0 NoCoverage, every
former Timeout meets FR-011, and the reference entries pass T024. But three entries miss 176 s: `1-60` (188.37 s),
`61-120` (251.13 s) and `121-180` (283.22 s). So lever 2 applies (T028).

### Lever 2: concurrency (T028)

`concurrency` in `stryker.config.json` as a scratch edit for each run (restored with `git checkout --
stryker.config.json`), on the slowest entry, `source.ts:121-180`, with the checker split as a diagnostic. Folders
`lever2/source-121-180-c4`, `lever2/source-121-180-c12` (each with `no-checker/`); concurrency 8 is the green run
above.

| `concurrency` | Processes with the checker (checkers / test runners) | Time, checker on | Checker off (diagnostic) | Statuses (checker on) | Within 176 s |
|---|---|---|---|---|---|
| 4 | 2 / 2 | 358.77 s | 66.23 s | 113 Killed, 111 CompileError, 0 Timeout | **no** |
| 8 (today) | 4 / 4 | 283.22 s | 76.87 s | 113 Killed, 111 CompileError, 0 Timeout | **no** |
| 12 | 6 / 6 | 316.27 s | 76.13 s | 113 Killed, 111 CompileError, 0 Timeout | **no** |

Every run ended exit 0. No candidate brings the slowest entry within 176 s on the 4-core sandbox; today's 8 is the
fastest of the three. The two-core runs (`taskset -c 0,1`) were not taken: they serve only to rank the candidates for a
2-vCPU CI runner, and with no candidate within 176 s on four cores none can be kept for two either; each would also
risk the 10-minute stop point (the four-core runs already take 283 s to 359 s). They are left for the operator's
decision below.

**Stop-and-ask point reached (tasks.md "after lever 2 (T028), any `source.ts` entry still misses 176 s").** After
levers 1 and 2, `source.ts:1-60`, `61-120` and `121-180` still miss 176 s with the checker on as configured, with 0
Timeout, 0 Survived and 0 NoCoverage. The checker-off figures (66 s to 95 s) are a diagnostic only. Lever 3 (spec
FR-014, an amendment of 001 FR-013) is the operator's decision; the phase stops here and does not work around it.

### Token build unchanged (T029, spec SC-005)

`pnpm --filter @ocelle/tokens build` at the phase base `6906cebc6eb785e909011695f06aa198386582c3` (a scratch worktree,
`pnpm run setup:offline` first, removed afterwards with `git worktree remove`) and at `ac27681`; `cmp` of
`packages/tokens/dist/tokens.css`, `tokens.json` and `index.d.ts`: identical (sha256 `c0ad9501…5e5e`, `c2c0e2e2…dae1`,
`53919512…0980`).

**Rerun at the final HEAD (after lever 3, 2026-11-11).** The same comparison again, at the phase base
`6906cebc6eb785e909011695f06aa198386582c3` (a fresh scratch worktree, `pnpm run setup:offline` with the environment
above, removed afterwards with `git worktree remove --force`, the worktree holding only the untracked `node_modules`
and `dist`) and at `f0efd4e` (the last commit before the phase's green commit; the green commit changes only
`specs/` and `knowledge/`). `cmp` of `tokens.css`, `tokens.json` and `index.d.ts`: identical, with the same sha256 as
above (`c0ad9501…5e5e`, `c2c0e2e2…dae1`, `53919512…0980`). `git diff --stat 6906ceb f0efd4e -- packages/` is empty.

## Lever 3: 30-line entries (phase 3, spec FR-014, T032 to T037)

**The decision.** After the stop-and-ask of T028 (`reviews/phase-3/stop-and-ask.md`), the operator decided lever 3,
"30-line entries, all files" (human:jeroennouwsdev, 2026-11-11, `reviews/phase-3/operator-decision-fr014.md`): 001
FR-013's entry bound for a split file goes from 60 to 30 changed lines, for every file; the 10-entry and 250-line shard
bounds and the rule that entries of one file never share a shard are unchanged. Red commit `4b3279a` (T032, the
`mutation-shards.test.ts` cases of the 60-line split rewritten for 30; 23 tests failed against the 60-line plan, all
assertion mismatches, `reviews/phase-3/red-lever-3.log`), green commit `3222ec2` (T033 `maxEntryLines = 30` in
`gates/lib/mutation/shards.ts`; T034 the records).

**Configuration.** As the lever 1 green runs: `vitest.mutation.config.ts` of lever 1 (commit `3986b74`),
`stryker.config.json` unchanged (`concurrency: 8`, the TypeScript checker on). Same sandbox (4 cores, Node 22.23.4,
Stryker 10.1.1), same environment, base `B = eaf16896ec10affdca24296fc9531fcffc46a8be` and command as the red runs; wall
time by `date +%s.%N` around the command (`time.txt`: seconds, then the gate's exit code). One run at a time, nothing
else heavy beside it. Taken 2026-11-11. *Note, 2026-11-11 (fix round 2, landing L1-01):* lever 1 was narrowed after
these runs (only `tokens-source-table` at 1, every other project at 2); the eight entries were run again with the
narrowed order in § Fix round 2 below.

### Plan (T035)

`lever3/plan.txt`: `pnpm --silent run gate:mutation -- --base "$B" --plan`, exit 0, **71 shards**. Its stderr:
`mutation: plan: 71 shards, 70 cuts within files (a mutant spanning a cut is mutated in no shard, see
gates/README.md)`, so the cut count is **70** (27 with 60-line entries, T001). The `source.ts` entries are
`packages/tokens/src/source.ts:1-30`, `:31-60`, `:61-90`, `:91-120`, `:121-150`, `:151-180`, `:181-210` and
`:211-230` (eight; every line of the 230 is changed against `B`). In the plan `source.ts:1-30` shares its shard with
`generate.ts:271-300`, `index.ts` and `overrides.ts`, and `source.ts:211-230` shares its shard with four Storybook
files; the six others are alone in their shards. The first `generate.ts` entry is now `packages/tokens/src/generate.ts:1-30`
(beside `packages/tokens/scripts/build.ts:61-62`); `gates/lib/wcag.ts` is still one whole entry.

### Lever 3 table (T036)

Folders `lever3/source-<start>-<end>/`; the checker split of each entry over 176 s under `no-checker/` (a scratch edit
of `stryker.config.json`, `"checkers": []`, restored with `git checkout -- stryker.config.json`).

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Ignored | Time | Checker split (diagnostic, not the checker's share): checker off / difference | Within 176 s |
|---|---|---|---|---|---|---|---|---|---|---|
| `source.ts:1-30` | 19 | 16 | 0 | 0 | 0 | 3 | 0 | 73.96 s | - | yes |
| `source.ts:31-60` | 115 | 54 | 0 | 0 | 0 | 61 | 0 | 166.19 s | - | yes |
| `source.ts:61-90` | 79 | 43 | 0 | 0 | 0 | 36 | 0 | 131.38 s | - | yes |
| `source.ts:91-120` | 123 | 60 | 0 | 0 | 0 | 63 | 0 | 177.68 s; re-run 171.53 s | 65.83 s / 111.85 s | first run no (1.68 s over); re-run yes |
| `source.ts:121-150` | 110 | 56 | 0 | 0 | 0 | 54 | 0 | 171.98 s | - | yes |
| `source.ts:151-180` | 114 | 57 | 0 | 0 | 0 | 57 | 0 | 182.52 s; re-run 170.49 s | 53.75 s / 128.77 s | first run no (6.52 s over); re-run yes |
| `source.ts:181-210` | 79 | 48 | 0 | 0 | 0 | 31 | 0 | 128.99 s | - | yes |
| `source.ts:211-230` | 40 | 22 | 0 | 0 | 0 | 18 | 0 | 91.36 s | - | yes |

Every run ended exit 0 with an empty stderr; each summary reads `mutation: <n> mutants on the changed lines of 1 file,
none survived; 0 timeouts, <c> compile errors, 0 zero-mutant entries; 0 equivalent records`. The checker-off runs:
123 and 114 Killed, 0 Timeout, 0 CompileError. Every entry has 0 Timeout, 0 Survived and 0 NoCoverage; six are within
176 s, two are not.

**Killed by** (test file of each `killedBy` id, checker on): `1-30`: 16 `validate.test.ts`; `31-60`: 44
`source-table.test.ts`, 6 `validate.test.ts`, 3 `build.test.ts`, 1 `contrast.test.ts`; `61-90`: 31
`source-table.test.ts`, 7 `validate.test.ts`, 5 `contrast.test.ts`; `91-120`: 48 `source-table.test.ts`, 6
`validate.test.ts`, 6 `contrast.test.ts`; `121-150`: 53 `source-table.test.ts`, 3 `validate.test.ts`; `151-180`: 55
`source-table.test.ts`, 2 `build.test.ts`; `181-210`: 48 and `211-230`: 22 `source-table.test.ts`. `testsCompleted` of
the Killed mutants: 12 to 38 in `1-30`, 4 to 141 in `31-60` and `61-90`, 4 to 176 in `91-120` (the contrast-killed
mutants run every token test first), 4 to 10 in `121-150` to `211-230`.

The mutant count does not set the time alone: `151-180` (114 mutants, 57 CompileError) is the slowest, slower than
`91-120` (123 mutants, 63 CompileError), and its checker-off run is the fastest of the two. With the checker on, half
the processes check types (R-06), so the time is mostly the checker's queue and the fixed start of the run.

### Per-mutant comparison, red against lever 3 (T036)

Each red 60-line entry against the two 30-line entries that cover it, with `evidence/compare.mjs` extended for lever 3
(the green argument names both reports, comma-separated; `--cuts L` names the new cut between line L and L + 1; a key
only in the red run is accepted, and listed as "cut limit", only if its mutant starts on or before L and ends after
L; every other unmatched key, and any key only in the lever 3 runs, still fails). Run from the repository root; the
commands and their output verbatim:

```text
$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-1-60/mutation.json specs/007-mutation-gate-strictness/evidence/lever3/source-1-30/mutation.json,specs/007-mutation-gate-strictness/evidence/lever3/source-31-60/mutation.json packages/tokens/src/source.ts --cuts 30
packages/tokens/src/source.ts: 134 mutants in both runs, every key once
cut limit 30:151-32:2 BlockStatement "{}": CompileError in the red run, in no 30-line entry
move CompileError -> CompileError: 64
move Killed -> Killed: 70
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-61-120/mutation.json specs/007-mutation-gate-strictness/evidence/lever3/source-61-90/mutation.json,specs/007-mutation-gate-strictness/evidence/lever3/source-91-120/mutation.json packages/tokens/src/source.ts --cuts 90
packages/tokens/src/source.ts: 202 mutants in both runs, every key once
move CompileError -> CompileError: 99
move Killed -> Killed: 103
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-121-180/mutation.json specs/007-mutation-gate-strictness/evidence/lever3/source-121-150/mutation.json,specs/007-mutation-gate-strictness/evidence/lever3/source-151-180/mutation.json packages/tokens/src/source.ts --cuts 150
packages/tokens/src/source.ts: 224 mutants in both runs, every key once
move CompileError -> CompileError: 111
move Killed -> Killed: 67
move Timeout -> Killed: 46
changed 122:46-122:115 StringLiteral "\"\"": Timeout -> Killed
changed 124:44-124:58 StringLiteral "\"\"": Timeout -> Killed
changed 125:49-125:58 StringLiteral "\"\"": Timeout -> Killed
changed 126:49-126:59 StringLiteral "\"\"": Timeout -> Killed
changed 127:49-127:55 StringLiteral "\"\"": Timeout -> Killed
changed 128:51-128:62 StringLiteral "\"\"": Timeout -> Killed
changed 129:54-129:64 StringLiteral "\"\"": Timeout -> Killed
changed 130:49-130:58 StringLiteral "\"\"": Timeout -> Killed
changed 131:49-131:57 StringLiteral "\"\"": Timeout -> Killed
changed 132:50-132:60 StringLiteral "\"\"": Timeout -> Killed
changed 133:54-133:60 StringLiteral "\"\"": Timeout -> Killed
changed 134:55-134:61 StringLiteral "\"\"": Timeout -> Killed
changed 135:56-135:62 StringLiteral "\"\"": Timeout -> Killed
changed 136:56-136:61 StringLiteral "\"\"": Timeout -> Killed
changed 137:54-137:60 StringLiteral "\"\"": Timeout -> Killed
changed 138:56-138:61 StringLiteral "\"\"": Timeout -> Killed
changed 139:55-139:60 StringLiteral "\"\"": Timeout -> Killed
changed 140:55-140:60 StringLiteral "\"\"": Timeout -> Killed
changed 141:56-141:61 StringLiteral "\"\"": Timeout -> Killed
changed 142:53-142:62 StringLiteral "\"\"": Timeout -> Killed
changed 145:45-145:54 StringLiteral "\"\"": Timeout -> Killed
changed 146:45-146:53 StringLiteral "\"\"": Timeout -> Killed
changed 147:45-147:54 StringLiteral "\"\"": Timeout -> Killed
changed 148:45-148:51 StringLiteral "\"\"": Timeout -> Killed
changed 149:45-149:54 StringLiteral "\"\"": Timeout -> Killed
changed 150:45-150:53 StringLiteral "\"\"": Timeout -> Killed
changed 151:45-151:51 StringLiteral "\"\"": Timeout -> Killed
changed 152:45-152:53 StringLiteral "\"\"": Timeout -> Killed
changed 153:45-153:51 StringLiteral "\"\"": Timeout -> Killed
changed 154:46-154:52 StringLiteral "\"\"": Timeout -> Killed
changed 161:50-161:55 StringLiteral "\"\"": Timeout -> Killed
changed 162:49-162:54 StringLiteral "\"\"": Timeout -> Killed
changed 163:50-163:55 StringLiteral "\"\"": Timeout -> Killed
changed 164:47-164:52 StringLiteral "\"\"": Timeout -> Killed
changed 165:47-165:54 StringLiteral "\"\"": Timeout -> Killed
changed 166:47-166:56 StringLiteral "\"\"": Timeout -> Killed
changed 167:46-167:55 StringLiteral "\"\"": Timeout -> Killed
changed 168:45-168:54 StringLiteral "\"\"": Timeout -> Killed
changed 169:46-169:54 StringLiteral "\"\"": Timeout -> Killed
changed 170:48-170:56 StringLiteral "\"\"": Timeout -> Killed
changed 171:51-171:59 StringLiteral "\"\"": Timeout -> Killed
changed 172:57-172:62 StringLiteral "\"\"": Timeout -> Killed
changed 175:57-175:66 StringLiteral "\"\"": Timeout -> Killed
changed 176:54-176:63 StringLiteral "\"\"": Timeout -> Killed
changed 177:57-177:64 StringLiteral "\"\"": Timeout -> Killed
changed 178:59-178:66 StringLiteral "\"\"": Timeout -> Killed
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/source-181-230/mutation.json specs/007-mutation-gate-strictness/evidence/lever3/source-181-210/mutation.json,specs/007-mutation-gate-strictness/evidence/lever3/source-211-230/mutation.json packages/tokens/src/source.ts --cuts 210
packages/tokens/src/source.ts: 119 mutants in both runs, every key once
cut limit 206:3-211:4 ObjectLiteral "{}": CompileError in the red run, in no 30-line entry
move CompileError -> CompileError: 49
move Killed -> Killed: 59
move Timeout -> Killed: 11
changed 181:60-181:67 StringLiteral "\"\"": Timeout -> Killed
changed 182:50-182:58 StringLiteral "\"\"": Timeout -> Killed
changed 183:46-183:54 StringLiteral "\"\"": Timeout -> Killed
changed 186:50-186:56 StringLiteral "\"\"": Timeout -> Killed
changed 187:53-187:59 StringLiteral "\"\"": Timeout -> Killed
changed 188:50-188:56 StringLiteral "\"\"": Timeout -> Killed
changed 190:55-190:63 StringLiteral "\"\"": Timeout -> Killed
changed 209:21-209:87 StringLiteral "\"\"": Timeout -> Killed
changed 224:64-224:98 StringLiteral "\"\"": Timeout -> Killed
changed 224:106-224:112 StringLiteral "\"\"": Timeout -> Killed
changed 225:50-225:57 StringLiteral "\"\"": Timeout -> Killed
(exit 0)

```

Without `--cuts`, the same script fails loudly as before: `node … compare.mjs red/source-1-60/mutation.json
lever3/source-1-30/mutation.json packages/tokens/src/source.ts` ends exit 1, naming `30:151-32:2 BlockStatement "{}"`
and every key of `31-60` as "key only in the red run".

So: no key repeats and no key is only in the lever 3 runs; every red key is in a lever 3 run except the **cut limit**,
two mutants that span the new cuts and are mutated in no 30-line entry (001 FR-013, accepted limit):

| Mutant | Spans the cut | Red (checker on) | Red (checker off) | Lever 1 green |
|---|---|---|---|---|
| `30:151-32:2` BlockStatement → `{}` (the body of `function tokenRecords`) | 30 / 31 | CompileError | Killed | CompileError |
| `206:3-211:4` ObjectLiteral → `{}` (the whole `elevation-raised` record) | 210 / 211 | CompileError | Killed | CompileError |

Both were CompileError in the red run and in the lever 1 runs, and neither is one of the 122 former Timeouts. The cuts
at 60 / 61, 120 / 121 and 180 / 181 were already cuts of the red plan, so the mutants spanning them were in no red run
either. No mutant moved Killed → Timeout, Survived or NoCoverage, so no re-run was due (R-06). The only moves are the 57
Timeouts of the red run, all to Killed, as with lever 1.

### Re-run of the two entries over 176 s (operator decision after lever 3)

The operator answered the stop-and-ask after lever 3 with "Re-run the two once" (human:jeroennouwsdev, 2026-11-11,
`reviews/phase-3/operator-decision-lever-3-rerun.md`): `source.ts:91-120` and `source.ts:151-180` re-measured once
each, alone, with the same command, base `B = eaf16896ec10affdca24296fc9531fcffc46a8be`, environment and
configuration (lever 1 and lever 3 in place, `stryker.config.json` unchanged, the checker on). Folders
`lever3/source-91-120/rerun/` and `lever3/source-151-180/rerun/`, each committed as soon as it was written (`0866a74`,
`f0efd4e`). Taken 2026-11-11.

| Entry | First run (T036) | Re-run | Re-run mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Within 176 s |
|---|---|---|---|---|---|---|---|---|---|
| `source.ts:91-120` | 177.68 s, exit 0 | 171.53 s, exit 0 | 123 | 60 | 0 | 0 | 0 | 63 | first run no (1.68 s over), re-run yes (4.47 s under) |
| `source.ts:151-180` | 182.52 s, exit 0 | 170.49 s, exit 0 | 114 | 57 | 0 | 0 | 0 | 57 | first run no (6.52 s over), re-run yes (5.51 s under) |

**Both re-runs are within 176 s.** Both ended exit 0 with an empty stderr and the summary `mutation: 123 mutants on the
changed lines of 1 file, none survived; 0 timeouts, 63 compile errors, 0 zero-mutant entries; 0 equivalent records`
(`91-120`) and `mutation: 114 mutants …; 0 timeouts, 57 compile errors, …` (`151-180`). The spread between the two runs
of one entry (6.15 s and 12.03 s) is the sandbox's variance on the same work: the per-mutant comparison of each first
run against its re-run moves no mutant.

```text
$ node evidence/compare.mjs evidence/lever3/source-91-120/mutation.json evidence/lever3/source-91-120/rerun/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 123 mutants in both runs, every key once
move CompileError -> CompileError: 63
move Killed -> Killed: 60
exit 0
$ node evidence/compare.mjs evidence/lever3/source-151-180/mutation.json evidence/lever3/source-151-180/rerun/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 114 mutants in both runs, every key once
move CompileError -> CompileError: 57
move Killed -> Killed: 57
exit 0
```

Both runs of each entry are kept and recorded; neither first run is discarded. The first runs missed the sandbox bound
by 1.68 s and 6.52 s, the re-runs are within it, so the margin of these two entries on the sandbox is a few seconds
either way. The CI measurement at landing (480 s per `gate:mutation` step, spec FR-010) decides; see "Open for
landing" below.

### FR-011 with lever 3 (T036)

The 122 mutants of the FR-011 record (T025), matched by key in the eight lever 3 reports: all 122 are in a lever 3
run. 65 (group A) end CompileError, each a CompileError in the red run as configured; 57 end Killed, each by a named
test of `source-table.test.ts` (56 by "declares each token's light value (or its one value) in the unconditioned :root
block", 1, the dark value of `elevation-bar` `224:106-224:112`, by "declares each theme-dependent token's dark value
under both dark selectors, where it differs from light"), each `statusReason` an `expect` mismatch (`expected … to
deeply equal …`), after 5 or 6 completed tests. 122 of 122 meet FR-011, with the same statuses and killing tests as in
the lever 1 record above. (Checked with a scratch script over the kept reports, as in phase 1.)

### FR-013 reference entries with lever 3

Not re-run. The lever changes only how `--plan` cuts entries; Stryker's and Vitest's configuration are those of the
lever 1 green runs, whose reference runs (`generate.ts:1-60`, `wcag.ts`) are above. `gates/lib/wcag.ts` stays one
whole entry; `generate.ts:1-60` is no longer an entry of the plan (now `generate.ts:1-30` and `31-60`).

*Note, 2026-11-11 (fix round 2, landing L1-01):* with lever 1 narrowed, both reference entries were run again, and
the static mutants of gate source were compared against `main`'s mutation configuration; see § Fix round 2 below.

### Decision (T037)

From the figures above alone (FR-009, FR-010, FR-011): every `source.ts` entry has 0 Timeout, 0 Survived and 0
NoCoverage, and FR-011 holds for all 122 former Timeouts, but **two entries miss 176 s**: `source.ts:91-120`
(177.68 s) and `source.ts:151-180` (182.52 s). Each was measured once and is recorded as measured; neither was re-run.

**Stop-and-ask point reached** (the operator's decision, "If any entry still misses 176 s or keeps a Timeout, the
question goes back to the operator"). T029 (rerun), T030 and T031 stay open; the phase stops here
(`reviews/phase-3/stop-and-ask-lever-3.md`).

**After the operator's decision (2026-11-11).** The operator decided "Re-run the two once"
(`reviews/phase-3/operator-decision-lever-3-rerun.md`). Both re-runs are within 176 s (`91-120`: 171.53 s,
`151-180`: 170.49 s; § Re-run above), with 0 Timeout, 0 Survived, 0 NoCoverage and the same status for every mutant as
in the first runs, so FR-011 holds as recorded. Per the decision ("If both are within 176 s, record both runs and go
on"), both runs of each entry are recorded and T029 to T031 follow. Every `source.ts` entry now has a run within
176 s; the first runs of `91-120` and `151-180` did not, and "Open for landing" names them with their margins. The CI
measurement at landing decides (FR-010).

## Checks and FR-012 (T031)

Run on 2026-11-11 at `f0efd4e` with the knowledge and evidence edits of the green commit in the working tree, one at a
time, with the environment above:

- `pnpm test`: exit 0, `unit-tests: 2099 tests passed in 97 files`.
- `pnpm run gate:typecheck`: exit 0, `typecheck: no type error in the files of tsconfig.json`.
- `pnpm run gate:lint`: exit 0, `lint: 173 files checked, no finding`.
- `pnpm run gate:test-lint`: exit 0, `test-lint: 114 files checked, no finding`.
- `pnpm run gate:mutation -- --base 6906cebc6eb785e909011695f06aa198386582c3` (the phase 3 base), alone: exit 0 after
  43.60 s, saved to `us2-gate.log`. The phase's diff to mutate is `gates/bin/mutation.ts` and
  `gates/lib/mutation/shards.ts` (11 changed lines, one shard, 0 cuts): comments and `maxEntryLines = 30`. Both report
  `zero-mutants: no mutant on the changed lines` (Stryker has no mutator for a number literal), and the summary is
  `0 mutants on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 2 zero-mutant entries; 0
  equivalent records`. The 30-line bound itself is held by the `mutation-shards.test.ts` cases of T032 (red
  `4b3279a`).

**FR-012.** `git diff --stat bfd31fec6c61ffc8f2dcdb1616fc3b7b82e14917 -- packages/tokens/src stryker.config.json`
(the phase-1 base) prints nothing: no change, and lever 2 kept no `concurrency` value. `grep -rn "Stryker disable"
packages/tokens/src` prints one line, `packages/tokens/src/generate.ts:180` (`Stryker disable next-line
ArrayDeclaration: equivalent, …`), which is already at the phase-1 base (`git grep -n "Stryker disable" bfd31fec --
packages/tokens/src` prints the same line): nothing new. FR-009 and FR-010 were reached by faster kills (lever 1) and
smaller entries (lever 3), not by removing mutants.

## Fix round 2: lever 1 narrowed (operator round from the landing review, 2026-11-11)

Landing review L1-01 (`reviews/landing/round-1.md`), decided by the operator as "Only source-table first
(Recommended)" (human:jeroennouwsdev, 2026-11-11, `reviews/phase-3/round-2.md` O2-01; research R-05, amendment
2026-11-11). Tasks T043 to T052. Taken 2026-11-11 on the same sandbox (4 cores, Node 22.23.4, Stryker 10.1.1), with the
same environment; wall time by `date +%s.%N` around the command (`time.txt`: seconds, then the gate's exit code). One
run at a time, nothing else heavy beside it.

**Configuration.** `vitest.mutation.config.ts` (green commit `1a269c5`): `tokens-source-table`
(`source-table.test.ts`) alone at `sequence: { groupOrder: 1 }`; every other mutation project, the rest of `tokens`
included (`tokens`, `styles`, `elements`, `storybook`, `gates`), at `sequence: { groupOrder: 2 }`, so after
`source-table.test.ts` the files run in Vitest's default order (project name: `elements`, `gates`, `storybook`,
`styles`, `tokens`). The split of `tokens` and its `exclude` are unchanged; no project is at 0. `stryker.config.json`
is unchanged (`concurrency: 8`, the TypeScript checker on); `vitest.config.ts` and `pnpm test` are unchanged.

**Red** (`907039f`, `red.sh 3 fix-2`, `reviews/phase-3/red-fix-2.log`): two assertion mismatches of
`gates/test/integration/vitest-mutation-config.test.ts` against the earlier split, the sequence list (1, 2, 3, 3, 3, 3
against 1, 2, 2, 2, 2, 2) and the order test (the second module to start was a `tokens` one). The order test expected
the project name `elements`; Vitest names that browser project `elements (chromium)` at run time (one chromium
instance), so the green commit set the expected value to that exact name. The checks of T052 then showed that the
second project is not fixed: `elements` starts once Chromium is up, so a `gates` module often starts first (5 of 6
helper runs; one `pnpm test` run failed on it). Commit `de22a4a` therefore asserts that every module after
`source-table.test.ts` that starts before the cancel belongs to `elements (chromium)`, `gates`, `storybook` or
`styles`, so not to `tokens`; with the configuration of `907039f` set in the working tree it fails (`expected [
Array(4) ] to include 'tokens'`), and it was restored afterwards.

**Plants** (T047, `fix-2/plants.txt`): `gate:plants` alone, 152 s, exit 0, `plants: 186 plants of 13 gates and the
registry judged, every plant as expected`.

### Gate source, FR-013 (T045, T048)

`pnpm --silent run gate:mutation -- --base 3a247ef5f684a102f95e433e7cf41550839c79e4 --files
gates/lib/mutation/report.ts,gates/lib/plant-judge.ts`, three runs, one at a time:

- `fix-2/gate-source/lever1/`: the earlier split, at the red commit `907039f` (T045 (a), before the fix);
- `fix-2/gate-source/main-config/`: a scratch worktree of `907039f` with only `vitest.mutation.config.ts` and
  `gates/test/vitest-config.test.ts` checked out from `3a247ef` (`main`), `pnpm run setup:offline` in it, removed
  afterwards (T045 (b));
- `fix-2/gate-source/narrowed/`: the narrowed order, at the green commit `1a269c5` (T048).

| Run | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Ignored | Time |
|---|---|---|---|---|---|---|---|---|
| lever1 (earlier split) | 235 | 161 | 2 | 0 | 0 | 68 | 4 | 182.72 s, exit 0 |
| main-config (`main`'s order) | 235 | 163 | 0 | 0 | 0 | 68 | 4 | 170.45 s, exit 0 |
| narrowed | 235 | 163 | 0 | 0 | 0 | 68 | 4 | 179.90 s, exit 0 |

(`report.ts` 69 mutants, `plant-judge.ts` 166.) Every run printed `mutation: 235 mutants on the changed lines of 2
files, none survived; <t> timeouts, 68 compile errors, 0 zero-mutant entries; 1 equivalent record`, with `<t>` 2, 0
and 0, and an empty stderr.

**The static mutants** (`static: true` in the kept reports): 13, as landing L1-01 counted. Status in lever1 /
main-config / narrowed, with the killing test file:

| Mutant | lever1 | main-config | narrowed |
|---|---|---|---|
| `report.ts` `106:17` Regex → `/\d+$/` | **Timeout** | Killed (`mutation-report.test.ts`) | Killed (`mutation-report.test.ts`) |
| `report.ts` `106:17` Regex → `/^\d+/`, `/^\d$/`, `/^\D+$/` (3) | Killed | Killed | Killed |
| `plant-judge.ts` `51:63` StringLiteral → `""` | **Timeout** | Killed (`plant-judge.test.ts`) | Killed (`plant-judge.test.ts`) |
| `plant-judge.ts` `51:23`, `51:33`, `51:40`, `51:52`, `51:74`, `51:83` StringLiteral → `""` (6) | Killed (`plants.test.ts`) | Killed (`plants.test.ts`) | Killed (`plants.test.ts`) |
| `plant-judge.ts` `51:22` ArrayDeclaration → `[]` | CompileError | CompileError | CompileError |
| `plant-judge.ts` `239:13` ArrowFunction → `() => undefined` | CompileError | CompileError | CompileError |

Run (a) is the red evidence: 2 Timeouts, both static, both Killed with `main`'s order (landing L1-01 saw 2 at HEAD in
its `--files` run and 8 in its whole-diff run; which mutants move varies with load).

**Per-mutant comparisons** (`fix-2/gate-source/compare.txt`), run from the repository root; the commands and their
output verbatim:

```text
$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/main-config/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/narrowed/mutation.json gates/lib/mutation/report.ts
gates/lib/mutation/report.ts: 69 mutants in both runs, every key once
move CompileError -> CompileError: 16
move Ignored -> Ignored: 4
move Killed -> Killed: 49
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/main-config/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/narrowed/mutation.json gates/lib/plant-judge.ts
gates/lib/plant-judge.ts: 166 mutants in both runs, every key once
move CompileError -> CompileError: 52
move Killed -> Killed: 114
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/lever1/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/narrowed/mutation.json gates/lib/mutation/report.ts
gates/lib/mutation/report.ts: 69 mutants in both runs, every key once
move CompileError -> CompileError: 16
move Ignored -> Ignored: 4
move Killed -> Killed: 48
move Timeout -> Killed: 1
changed 106:17-106:24 Regex "/\\d+$/": Timeout -> Killed
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/lever1/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/gate-source/narrowed/mutation.json gates/lib/plant-judge.ts
gates/lib/plant-judge.ts: 166 mutants in both runs, every key once
move CompileError -> CompileError: 52
move Killed -> Killed: 113
move Timeout -> Killed: 1
changed 51:63-51:72 StringLiteral "\"\"": Timeout -> Killed
(exit 0)
```

**main-config → narrowed** (the FR-013 check): no status move in either file; no Killed → Timeout, Survived or
NoCoverage, and no count moves (Killed 49 and 114, Timeout 0, in both runs). No Timeout of `main-config` to list: it has
none. No re-run was due (T024's rule applies only to a Killed → Timeout move). **lever1 → narrowed**: the two
Timeouts of run (a), `report.ts:106:17` Regex `/\d+$/` and `plant-judge.ts:51:63` StringLiteral `""`, are both Killed
now.

### `source.ts` entries with the narrowed order (T049)

The T036 command with base `B = eaf16896ec10affdca24296fc9531fcffc46a8be`, `--files packages/tokens/src/source.ts:<start>-<end>`, at the
green configuration; folders `fix-2/source-<start>-<end>/`, each committed as soon as it was written.

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Ignored | Time (lever 3, first run) | Time (narrowed) | Within 176 s |
|---|---|---|---|---|---|---|---|---|---|---|
| `source.ts:1-30` | 19 | 16 | 0 | 0 | 0 | 3 | 0 | 73.96 s | 72.49 s | yes |
| `source.ts:31-60` | 115 | 54 | 0 | 0 | 0 | 61 | 0 | 166.19 s | 163.14 s | yes |
| `source.ts:61-90` | 79 | 43 | 0 | 0 | 0 | 36 | 0 | 131.38 s | 123.93 s | yes |
| `source.ts:91-120` | 123 | 60 | 0 | 0 | 0 | 63 | 0 | 177.68 s (re-run 171.53 s) | 173.46 s | yes |
| `source.ts:121-150` | 110 | 56 | 0 | 0 | 0 | 54 | 0 | 171.98 s | 168.86 s | yes |
| `source.ts:151-180` | 114 | 57 | 0 | 0 | 0 | 57 | 0 | 182.52 s (re-run 170.49 s) | 168.05 s | yes |
| `source.ts:181-210` | 79 | 48 | 0 | 0 | 0 | 31 | 0 | 128.99 s | 131.29 s | yes |
| `source.ts:211-230` | 40 | 22 | 0 | 0 | 0 | 18 | 0 | 91.36 s | 87.51 s | yes |

Every run ended exit 0 with an empty stderr and the summary `mutation: <n> mutants on the changed lines of 1 file, none
survived; 0 timeouts, <c> compile errors, 0 zero-mutant entries; 0 equivalent records`. No entry was over 176 s, so no
checker split was taken. The slowest is `91-120`, 173.46 s, 2.54 s under the bound.

**Per-mutant comparison against lever 3** (`fix-2/compare-source-lever3.txt`; the first lever 3 run for `91-120` and
`151-180`), verbatim:

```text
$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-1-30/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-1-30/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 19 mutants in both runs, every key once
move CompileError -> CompileError: 3
move Killed -> Killed: 16
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-31-60/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-31-60/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 115 mutants in both runs, every key once
move CompileError -> CompileError: 61
move Killed -> Killed: 54
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-61-90/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-61-90/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 79 mutants in both runs, every key once
move CompileError -> CompileError: 36
move Killed -> Killed: 43
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-91-120/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-91-120/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 123 mutants in both runs, every key once
move CompileError -> CompileError: 63
move Killed -> Killed: 60
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-121-150/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-121-150/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 110 mutants in both runs, every key once
move CompileError -> CompileError: 54
move Killed -> Killed: 56
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-151-180/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-151-180/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 114 mutants in both runs, every key once
move CompileError -> CompileError: 57
move Killed -> Killed: 57
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-181-210/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-181-210/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 79 mutants in both runs, every key once
move CompileError -> CompileError: 31
move Killed -> Killed: 48
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/lever3/source-211-230/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/source-211-230/mutation.json packages/tokens/src/source.ts
packages/tokens/src/source.ts: 40 mutants in both runs, every key once
move CompileError -> CompileError: 18
move Killed -> Killed: 22
(exit 0)
```

No mutant changed status: the narrowing moves none in `source.ts`.

**Killed by** (test file of each `killedBy` id, checker on): `1-30`: 16 `contrast.test.ts` (lever 3: 16
`validate.test.ts`); `31-60`: 44 `source-table.test.ts`, 10 `contrast.test.ts` (lever 3: 44, 6 `validate.test.ts`, 3
`build.test.ts`, 1 `contrast.test.ts`); `61-90`: 31 `source-table.test.ts`, 12 `contrast.test.ts` (lever 3: 31, 7
`validate.test.ts`, 5 `contrast.test.ts`); `91-120`: 48 `source-table.test.ts`, 6 `brand-rules.test.ts`, 6
`contrast.test.ts` (lever 3: 48, 6 `validate.test.ts`, 6 `contrast.test.ts`); `121-150`: 53 `source-table.test.ts`, 3
`brand-rules.test.ts` (lever 3: 53, 3 `validate.test.ts`); `151-180`: 55 `source-table.test.ts`, 2 `contrast.test.ts`
(lever 3: 55, 2 `build.test.ts`); `181-210`: 48 and `211-230`: 22 `source-table.test.ts` (as lever 3). As expected,
the kills that `validate.test.ts` and `build.test.ts` made with the earlier split now come from the gate tests
(`gates/test/contrast.test.ts`, `gates/test/brand-rules.test.ts`), which run before the rest of `tokens`; no kill comes
from `build.test.ts` now. `source-table.test.ts`'s kills are unchanged in every entry. `testsCompleted` of the Killed
mutants: 12 to 151 in `1-30`, 4 to 12 in `31-60` and `61-90`, 4 to 47 in `91-120`, 4 to 10 in `121-150` to `211-230`.

**FR-011.** The 122 mutants of the FR-011 record (T025), matched by key in the eight new reports: all 122 are in a run.
65 (group A) end CompileError, each a CompileError in the red run as configured; 57 end Killed, each by a named test of
`source-table.test.ts` (56 by "declares each token's light value (or its one value) in the unconditioned :root block",
1 by "declares each theme-dependent token's dark value under both dark selectors, where it differs from light"), each
`statusReason` an `expect` mismatch (`expected … to deeply equal …`), after 5 or 6 completed tests. **122 of 122 meet
FR-011**, with the same statuses and killing tests as with lever 3. (Checked with a scratch script over the kept
reports, as in phase 1; the same script gives 122 of 122 on the lever 3 reports.)

### FR-013 reference entries with the narrowed order (T050)

The T036 command with base `B`; folders `fix-2/generate-1-60/` (`--files packages/tokens/src/generate.ts:1-60`, the
red entry as is) and `fix-2/wcag/` (`--files gates/lib/wcag.ts`).

| Entry | Mutants | Killed | Timeout | Survived | NoCoverage | CompileError | Ignored | Time (red) | Time (narrowed) |
|---|---|---|---|---|---|---|---|---|---|
| `generate.ts:1-60` | 7 | 3 | 0 | 0 | 0 | 4 | 0 | 78.11 s | 71.35 s, exit 0 |
| `gates/lib/wcag.ts` | 33 | 26 | 2 | 0 | 0 | 3 | 2 | 90.92 s | 82.39 s, exit 0 |

Comparisons against `red/generate-1-60/` and `red/wcag/` (`fix-2/compare-reference.txt`), verbatim:

```text
$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/generate-1-60/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/generate-1-60/mutation.json packages/tokens/src/generate.ts
packages/tokens/src/generate.ts: 7 mutants in both runs, every key once
move CompileError -> CompileError: 4
move Killed -> Killed: 3
(exit 0)

$ node specs/007-mutation-gate-strictness/evidence/compare.mjs specs/007-mutation-gate-strictness/evidence/red/wcag/mutation.json specs/007-mutation-gate-strictness/evidence/fix-2/wcag/mutation.json gates/lib/wcag.ts
gates/lib/wcag.ts: 33 mutants in both runs, every key once
move CompileError -> CompileError: 3
move Ignored -> Ignored: 2
move Killed -> Killed: 26
move Timeout -> Timeout: 2
(exit 0)
```

No Killed → Timeout, Survived or NoCoverage move and no count the wrong way. `wcag.ts`'s 2 Timeouts (`:4`, Regex) were
Timeouts in the red run (Timeout → Timeout). No re-run was due.

### Whole-diff run (T052)

`pnpm run gate:mutation -- --base 3a247ef5f684a102f95e433e7cf41550839c79e4`, alone, at `4c78197`: exit 0 after
211.45 s, saved to `fix-2/whole-diff.log`. Summary: `mutation: 305 mutants on the changed lines of 5 files, none
survived; 0 timeouts, 82 compile errors, 0 zero-mutant entries; 1 equivalent record`. **No `timeout` line**, so none
of `report.ts` or `plant-judge.ts` (landing L1-01: 8, `report.ts:106` ×4 and `plant-judge.ts:51` ×4). Per file, from
its report: `report.ts` 49 Killed, 16 CompileError, 4 Ignored; `plant-judge.ts` 114 Killed, 52 CompileError, the
same as the T048 `narrowed` and `main-config` runs; `gates/bin/mutation.ts` 18 Killed, 1 CompileError;
`gates/lib/mutation/shards.ts` 33 Killed, 13 CompileError; `gates/lib/findings.ts` 5 Killed.

### Decision (fix round 2)

From the figures above alone: with the narrowed order, the 13 static mutants of gate source have the same status as
with `main`'s mutation configuration (FR-013 holds for gate source; the two Timeouts of the earlier split are Killed);
every `source.ts` entry has 0 Timeout, 0 Survived and 0 NoCoverage and finishes within 176 s on its one run (72.49 s
to 173.46 s; FR-009, FR-010 sandbox half); FR-011 holds for all 122 former Timeouts; the reference entries move no
mutant (FR-013). No stop-and-ask point of the round was reached. The CI half of FR-010 is measured at landing with
the narrowed order (§ Open for landing).

**Checks** (T052), at `de22a4a` with the records in the working tree, one at a time: `pnpm test` exit 0,
`unit-tests: 2102 tests passed in 97 files` (two earlier attempts failed one test each: a browser test of `prose.test.ts`
that passed three times alone, nothing in `packages/styles` changed, and the order test's race fixed in `de22a4a`);
`gate:typecheck` exit 0, `typecheck: no type error in the files of tsconfig.json`; `gate:lint` exit 0, `lint: 173
files checked, no finding`; `gate:test-lint` exit 0, `test-lint: 114 files checked, no finding`. **FR-012** again: `git diff --stat
bfd31fec6c61ffc8f2dcdb1616fc3b7b82e14917 -- packages/tokens/src stryker.config.json` prints nothing; `grep -rn
"Stryker disable" packages/tokens/src` prints only `packages/tokens/src/generate.ts:180`, already at the phase-1 base:
nothing new.

## Open for landing (spec FR-010, CI half; research R-07)

FR-010's CI half is **not done**: it is measured at landing, and the landing pass reads this section. The sandbox half
is recorded above (§ Lever 3 and § Re-run).

*Note, 2026-11-11 (fix round 2, landing L1-01, L1-02):* the CI measurement (landing L1-02) is taken after the fold of
fix round 2, with the narrowed lever 1 order (only `tokens-source-table` first). With that order the eight entries
were measured again on the sandbox (§ Fix round 2): every one within 176 s on its one run, the slowest `91-120`
(173.46 s); the table below gains that column, and the earlier text is kept.

**The sandbox bound (176 s), as measured.** With lever 1 and lever 3, every `source.ts` entry has a run within 176 s,
but two entries missed it on their first run:

| Entry | First run | Re-run | Missed 176 s by | Narrowed order (fix round 2, one run) |
|---|---|---|---|---|
| `source.ts:91-120` | 177.68 s | 171.53 s | 1.68 s on the first run; the re-run is 4.47 s under | 173.46 s (2.54 s under) |
| `source.ts:151-180` | 182.52 s | 170.49 s | 6.52 s on the first run; the re-run is 5.51 s under | 168.05 s (7.95 s under) |

The other six entries were measured once, each within 176 s (`1-30` 73.96 s, `31-60` 166.19 s, `61-90` 131.38 s,
`121-150` 171.98 s, `181-210` 128.99 s, `211-230` 91.36 s); `31-60` and `121-150` are within 10 s of the bound. With the
narrowed order (fix round 2): `1-30` 72.49 s, `31-60` 163.14 s, `61-90` 123.93 s, `121-150` 168.86 s, `181-210`
131.29 s, `211-230` 87.51 s; `31-60`, `91-120`, `121-150` and `151-180` are within 10 s of the bound. By the
operator's decision after lever 3 (`reviews/phase-3/operator-decision-lever-3-rerun.md`) no further change was made:
the CI measurement below (480 s per `gate:mutation` step) decides.

**The procedure** (research R-07, with its 2026-11-11 lever 3 amendment):

1. **The measurement commit**, on the mission's pull request, at landing (`/ocelle-land`): a trailing space on
   **every** line of `packages/tokens/src/source.ts`, the 8 blank lines included (230 lines). First check that
   `source.ts` has no template literal a trailing space would change; then build the tokens before and after and
   compare `dist/` byte for byte (`tokens.css`, `tokens.json`, `index.d.ts`): identical.
2. **The local `--plan` check**, before the commit is pushed: `pnpm --silent run gate:mutation -- --base <the pull
   request's base> --plan`. It must list exactly the **eight 30-line `source.ts` entries** `source.ts:1-30`, `31-60`,
   `61-90`, `91-120`, `121-150`, `151-180`, `181-210` and `211-230` (not the four 60-line entries R-07 first named),
   each in a shard alone or beside other files' entries (entries of one file never share a shard). Record that plan
   output (stdout and the cut line) with the evidence. If it lists other `source.ts` entries, stop: the commit is not
   the measured one.
3. **Record from CI** (`mutation-plan` and the `mutation-shard` jobs): which entries each shard holding a `source.ts`
   entry held, each such shard's `gate:mutation` step time as GitHub reports it, the runner's core count (R-05)
   and the run link. Each step must be within 480 s.
4. **The revert:** a `git revert` of the measurement commit on the pull request before merge. A job other than the
   mutation jobs that fails on the measurement commit only because of the trailing spaces (a format or lint check) does
   not count for or against FR-010; the revert restores it, and the evidence says so if it happens.

**Decision rules:**

- Every `source.ts` shard within 480 s: FR-010's CI half holds; record the figures.
- **A mixed shard over 480 s** (a `source.ts` entry beside entries of the mission's other changes): the entry is
  measured again on CI in a shard that holds it alone, and that time decides. The landing pass prepares a branch
  whose base is the mission's head (before the measurement commit) and whose only commit is the measurement commit;
  its diff is `source.ts` alone, so its plan is eight `source.ts`-only shards. No workflow change is needed. The
  orchestrator does not push it or open the pull request: the **operator pushes it and opens it as a draft pull
  request**. Its times, core count and run link are recorded, and it is closed unmerged. It is made only for this case.
- **An alone shard over 480 s** does not meet FR-010; a time over 480 s is never accepted as measured. The landing
  pass brings it to the operator as a decision at the landing gate, with two options: apply lever 2 (R-05) and measure
  again, or amend 001 FR-013 again under FR-014. Neither is a follow-up.
