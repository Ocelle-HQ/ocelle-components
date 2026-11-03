# Gates

Every merge gate of this repository (FR-020): what it checks, how to run it, the check it reports on pull requests,
and the planted defects that prove it can fail (FR-025). The contracts are in
`specs/001-repository-foundation/contracts/` (`gate-cli.md`, `plants.md`, `ci-checks.md`).

## How a gate runs

Each gate is `pnpm run gate:<id>` from the repository root, backed by `gates/bin/<id>.ts`, with one exit contract:

| Exit | Meaning |
|---|---|
| 0 | checked, nothing found (one summary line) |
| 1 | defects found: one line per finding, `<location>: <gate-id>: <rule>: <message>`, then a summary |
| 2 | could not run (missing tool or browser, unreadable or unparsable input, invalid configuration): one line naming the cause and the fix |

Every gate but the plant job takes `--root <dir>`, which sets the repository root and the tool's working directory
and changes nothing else. The registry of gates is `gates/gates.json`; the FR-020 list is in `gates/lib/registry.ts`.

## The gates

| Gate id | Check (CI) | Command | Checks (FR-028) | Plants (`gates/plants/<id>/`) |
|---|---|---|---|---|
| `typecheck` | Typecheck | `pnpm run gate:typecheck` | repository TypeScript, strict mode | implicit `any` in package source, gate source and element test code; pass: a strict file, an excluded fixture; breaking: a missing `/// <reference>` (TS6053) |
| `lint` | Code lint | `pnpm run gate:lint` | repository TypeScript (ESLint, `strictTypeChecked`) | a floating promise in package source and gate source; pass: a voided promise, an excluded fixture; breaking: a file that does not parse |
| `style-lint` | Style lint | `pnpm run gate:style-lint` | the styles of FR-024 (token-only) | a raw value in an element `css` template, in stylesheets of `elements/src`, `styles/src` and `styles/` outside `src/`, one per FR-024 reject class; pass: the ten allowed values, a story, element test code, token definitions; breaking: a stylesheet that does not parse |
| `unit-tests` | Unit tests | `pnpm run gate:unit-tests` (`pnpm test`) | every test file | a failing test in `tokens`, `styles`, a colocated test, `gates`, and `elements` in Chromium; pass: a passing test alone in each project, a failing fixture not run; breaking: a file that throws while loading, no test file |
| `test-lint` | Test lint | `pnpm run gate:test-lint` | all test code (FR-010) | the seven FR-010 patterns of SC-004, an assertion-free colocated element test and gate test; pass: a real assertion, an excluded fixture; breaking: a file that does not parse |
| `mutation` | Mutation testing | `pnpm run gate:mutation -- --base <sha>` | changed package source and gate source lines | an unchecked covered line, a line no test runs, a record without a reason, `// Stryker disable all`, a survivor in gate source; pass: a fully checked change, a reasoned record (listed), a test-only change, a `CompileError`-only change; breaking: a `--base` that does not resolve (the plant's `plant.json` `base`), a failed dry run |
| `csp` | Content security | `pnpm -r build && pnpm run gate:csp` | built output of the three packages | each FR-021 construct, a `style` attribute after a newline, `<svg/onload=>`, `(0, eval)(s)`; pass: `<script src>`, `setTimeout(fn, 0)`, `retrieval(x)`, `isFunction(x)`, an inline script in source; breaking: a `.js` file that does not parse |
| `prefix` | Prefix | `pnpm -r build && pnpm run gate:prefix` | package source, test code and built output of the three packages | `<sk-button>`, `<SK-Button>`, `--sk-color` in test code, an `sk-select` event in `dist/`, `monospace`, `Menlo`; pass: `task-list`, `desk-row`, `--risk-level`, a name outside the packages; breaking: invalid UTF-8 |
| `config-copies` | Story config copies | `pnpm run gate:config-copies` | the two story configuration copies (FR-006) | one setting differs, a narrowed `test_pathspec`; pass: equal copies; breaking: a copy missing |
| `pins` | Install and pins | `pnpm run gate:pins` | manifests, lockfile, version pins, `pnpm-workspace.yaml` | every pins fail plant of `contracts/plants.md` (lockfile, ranges, `workspace:` forms, version pins, release age, install scripts, hoisting); pass: a matching workspace with `workspace:0.0.0`; breaking: a `package.json` that is not JSON |
| `signoff` | Sign-off | `pnpm run gate:signoff -- --range <base>..<head>` | the commits of the pull request (FR-023) | no trailer, a mismatched trailer; pass: an agent signing off itself, an unsigned merge; breaking: an empty range |
| `plants` | Plants | `pnpm run gate:plants` | `gates/plants/` only, and the registry check | registry plants in `gates/plants/plants/`: a gate without an entry, a gate without a CI job; pass: a matching pair |

The plant job (`gates/bin/plants.ts`) first checks that `gates/gates.json`, the gate jobs of
`.github/workflows/ci.yml` and the FR-020 list are one set, then runs every plant through its gate in normal mode on
a temporary repository built from the plant and the repository's own configuration (only the inputs are swapped),
and fails when a fail plant is not caught with exactly its expected findings, a pass plant is not accepted, a
breaking plant is not reported as "could not run" for the cause it names, a gate lacks a fail, pass or breaking plant, a `plant.json` is
missing or invalid, or a plant carries gate configuration.

A plant's `plant.json` holds only what the plant expects (`expect`, `why`, `findings`, `records`, `cause`) and, for a
fail or breaking plant that presents its gate another base than its temporary repository's base commit, `base`: the
plant runner puts it in place of `{base}` in the gate's plant command. Every breaking plant names its `cause`, a
substring of a line the gate prints on its error output when it exits 2, so a breakage for another reason fails the
plant job; `cause` on a fail or pass plant, and `base` on a pass plant (which could then pass vacuously), make the
`plant.json` invalid (contracts/plants.md). The mutation plant `error-unresolvable-base` uses it to present
a `--base` that does not resolve in the temporary repository (contracts/plants.md, mutation row). It is an input of
the gate, like the plant's files, not gate configuration.

## Required checks on `main`

The workflow that runs on a pull request is the pull request's own `ci.yml`, so only a list kept outside the branch
makes a gate block the merge. The ruleset (or branch protection) on `main` requires exactly these twelve checks:

1. Typecheck
2. Code lint
3. Style lint
4. Unit tests
5. Test lint
6. Mutation testing
7. Content security
8. Prefix
9. Story config copies
10. Install and pins
11. Sign-off
12. Plants

A change to this set is a change to the ruleset, which the operator makes. The jobs `mutation-plan` and
`mutation-shard` serve the Mutation testing check and are not required themselves. `mutation-plan` splits the changed
files into entries, a file of more than 120 changed lines into line-range entries `path:start-end` of at most 120
changed lines, and fills them into shards of at most 10 entries and 250 changed lines (FR-013); each `mutation-shard`
job passes its shard's entries unchanged to `--files` and runs under a 10-minute limit. `.github/workflows/cache.yml`
(cache warming on `main`) is not a gate.

## Deferred gates (FR-026)

These gates of the constitution are not delivered by this feature; each is delivered with the issue named:

| Gate | Delivered by |
|---|---|
| Storybook build | #10 |
| Visual regression | #10 |
| Accessibility (axe) | #10 |
| Contrast check | #5 |
| Custom-elements manifest check | the first element feature (#7) or #10, whichever lands first |
| Remote loads in built output (constitution IV, beyond FR-021) | the first element feature |
