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
| `style-lint` | Style lint | `pnpm run gate:style-lint` | the styles of FR-024 (token-only), and since 002 every `var(--ocelle-…)` reference to a name that is neither a token of `packages/tokens/src/source.ts` nor a custom property `packages/elements/custom-elements.json` declares (exact name; 002 FR-010); in `packages/styles/**/*.css` a line height must be an `--ocelle-line-height-*` token or a CSS-wide keyword, and a `font` shorthand there must state one (003 FR-002); since 005 `scale` takes only the bare numbers `-1` and `1`, and any function in its value is raw, and the unit `lh` passes only as `1lh`, as the whole value or once per `calc()` expression as an operand of `+` or `-` beside an `--ocelle-*` token, and `aspect-ratio` takes only the bare number `1` as its whole value (005 R-03) | a raw value in an element `css` template, in stylesheets of `elements/src`, `styles/src` and `styles/` outside `src/`, one per FR-024 reject class; a misspelt token (`var(--ocelle-color-canvs)`), a misspelt element property (`var(--ocelle-button-gpa)`); the six `packages/styles` line-height fail plants (`fail-styles-literal-line-height`, `fail-styles-percent-line-height`, `fail-styles-calc-line-height`, `fail-styles-normal-line-height`, `fail-styles-font-without-line-height`, `fail-styles-other-token-line-height`); the three `scale` fail plants (`fail-scale-factor`, `fail-scale-length`, `fail-scale-calc`); the four `lh` fail plants (`fail-lh-multiple`, `fail-lh-multiple-calc`, `fail-lh-calc-factor`, `fail-lh-calc-twice`); the two `aspect-ratio` fail plants (`fail-aspect-ratio-other` with `aspect-ratio: 2`, `fail-aspect-calc` with `aspect-ratio: calc(2)`); pass: the ten allowed values (nine in `styles/src`; the unitless line height, `pass-line-height`, in `elements/src`), `pass-styles-line-height-token`, `pass-scale-mirror` (`scale: -1 1`), `pass-one-line` (`block-size: 1lh`), `pass-one-line-calc` (`padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2)`), `pass-aspect-square` (`aspect-ratio: 1`), a story, element test code, token definitions, real tokens, a declared element property; breaking: a stylesheet that does not parse, an element property with a token's full name |
| `unit-tests` | Unit tests | `pnpm run gate:unit-tests` (`pnpm test`) | every test file | a failing test in `tokens`, `styles`, a colocated test, `gates`, and `elements` in Chromium; pass: a passing test alone in each project, a failing fixture not run; breaking: a file that throws while loading, no test file |
| `test-lint` | Test lint | `pnpm run gate:test-lint` | all test code (FR-010) | the seven FR-010 patterns of SC-004, an assertion-free colocated element test and gate test; pass: a real assertion, an excluded fixture; breaking: a file that does not parse |
| `mutation` | Mutation testing | `pnpm run gate:mutation -- --base <sha>` | changed package source and gate source lines, and since 002 `storybook/scripts/`, `storybook/.storybook/` and `storybook/stories/` (not `*.stories.ts`); since 005 the changed files are split by configuration: element source (`packages/elements/src/**`) runs under `stryker.elements.config.json` (the in-process `elements` project alone), every other file under `stryker.config.json`, one Stryker run per non-empty group, results merged (005 research.md R-12), the 007 report lines of both runs too | an unchecked covered line, a line no test runs, a record without a reason, `// Stryker disable all`, a survivor in gate source, `fail-element-source-survivor`, `fail-element-source-no-coverage` (a new element module no test imports; Stryker's browser-mode runner reports its mutant `Survived`, the node projects `NoCoverage`), `fail-mixed-survivors` (a gate-source and an element-source survivor, both reported); pass: a fully checked change (no report line), a reasoned record (listed), a test-only change, a `CompileError`-only change (its `compile-error` report line), a type-only change (its `zero-mutants` report line, on a real Stryker run with no mutant), `pass-element-source`; breaking: a `--base` that does not resolve (the plant's `plant.json` `base`), a failed dry run, a failed dry run of a type-only change with no mutant. Report lines, not findings (007): `timeout`, `compile-error` and `zero-mutants` lines and their counts in the summary, the lines of both runs in the changed files' order |
| `csp` | Content security | `pnpm -r build && pnpm run gate:csp` | built output of the three packages; since 002 the Storybook inputs and HTML entries (below) | each FR-021 construct, a `style` attribute after a newline, `<svg/onload=>`, `(0, eval)(s)`, an inline script in `storybook/dist/index.html`, a `style` attribute in a story's markup string, `new Function` in `.storybook/preview.ts`, `eval` in `storybook/scripts/`; pass: `<script src>`, `setTimeout(fn, 0)`, `retrieval(x)`, `isFunction(x)`, an inline script in source, external scripts in a Storybook HTML entry, tag names in `storybook/scripts/externalise.ts`; breaking: a `.js` file that does not parse, a Storybook `.ts` file that does not parse |
| `prefix` | Prefix | `pnpm -r build && pnpm run gate:prefix` | package source, test code and built output of the three packages; since 002 the Storybook workspace (below) | `<sk-button>`, `<SK-Button>`, `--sk-color` in test code, an `sk-select` event in `dist/`, `monospace`, `Menlo`, `Menlo, monospace` in `storybook/.generated/swatches.css`; pass: `task-list`, `desk-row`, `--risk-level`, a name outside the packages; breaking: invalid UTF-8 |
| `config-copies` | Story config copies | `pnpm run gate:config-copies` | the two story configuration copies (FR-006) | one setting differs, a narrowed `test_pathspec`; pass: equal copies; breaking: a copy missing |
| `pins` | Install and pins | `pnpm run gate:pins` | manifests, lockfile, version pins, `pnpm-workspace.yaml`; an `allowBuilds` entry set to `true` is a finding unless it is one of the two approved install scripts, `rs-module-lexer@2.9.0` and `fsevents@2.3.3` (005 research.md R-16, operator decision 2026-11-10), each at its one version. Residual risks: on a platform without a native binding, `rs-module-lexer`'s script would `npm install` its wasm fallback outside the lockfile and the release-age policy (Linux, macOS and Windows have bindings); on macOS an install compiles `fsevents` with `node-gyp`, which needs a C/C++ toolchain and may fetch Node's headers from nodejs.org. The `fsevents` script runs only on macOS, where the repository has no runner, so its run is unverified | every pins fail plant of `contracts/plants.md` (lockfile, ranges, `workspace:` forms, version pins, release age, install scripts, hoisting), with `fail-allow-builds-unpinned-approval` (`rs-module-lexer: true`), `fail-allow-builds-unpinned-fsevents` (`fsevents: true`) and `fail-allow-builds-other-version` (`"rs-module-lexer@2.9.1": true`); pass: a matching workspace with `workspace:0.0.0`, and `pass-approved-build` (the two approved entries); breaking: a `package.json` that is not JSON |
| `signoff` | Sign-off | `pnpm run gate:signoff -- --range <base>..<head>` | the commits of the pull request (FR-023) | no trailer, a mismatched trailer; pass: an agent signing off itself, an unsigned merge; breaking: an empty range |
| `contrast` | Contrast | `pnpm run gate:contrast` | since 002: every pair of `packages/tokens/contrast/pairs.json` in both themes (WCAG 2.x, from the token values the root's generator resolves): its recorded figure at the figure's precision, its threshold (text 4.5:1, non-text 3:1, unrounded; disabled ink exempt), and the required pairs derived from the intended grounds of `packages/tokens/src/source.ts` (002 FR-016, FR-017, FR-021); `--print` lists the required pairs with their ratios | `text-below-threshold`, `non-text-below-threshold`, `figure-mismatch`, `unknown-token`, `missing-required-pair`, `excluded-without-reason`, `required-pair-excluded`, `not-opaque`; pass: `repository-values`, `exempt-disabled-ink`; breaking: `empty-list`, `unparsable-list`, `source-throws`, `exempt-not-disabled-ink` |
| `brand-rules` | Brand rules | `pnpm run gate:brand-rules` | since 002: rules (a) to (g) of 002 FR-019 on the token source, the stylesheet the root's generator makes from it and the excluded ochre pair of the pair list: no monospace font token, `color-link` apart from `color-accent` and at 4.5:1 on canvas and sheet, the closed radius set, decorative rules below 3:1, dark chrome, reduced motion at 0ms, nothing that defeats forced colours | `a-monospace`, `b-link-equals-accent`, `b-ochre-pair-not-excluded`, `c-extra-radius`, `c-wrong-value`, `d-rule-as-boundary`, `e-light-chrome`, `f-motion-not-zero`, `g-forced-colours-override`; pass: `repository-values`, `g-system-colour-mapping`; breaking: `source-throws`, `generator-throws`, `source-invalid` |
| `manifest` | Custom-elements manifest | `pnpm run gate:manifest` | since 005 (FR-009): the committed `packages/elements/custom-elements.json` against the manifest `packages/elements/scripts/manifest.ts` generates from `packages/elements/src/ocelle-*.ts` (the analyzer `@custom-elements-manifest/analyzer` 0.11.0 in process, then normalised), key order aside: a `stale` finding per differing element member (`<element>.<kind>.<name>`), per element in one manifest only, or one for the whole file; a `no-description` finding at the element's module per public property, attribute, event, slot, CSS part or CSS custom property without a description; exit 2 when the manifest is missing or not JSON, or no element module can be analysed | `fail-stale-property`, `fail-lost-attribute`, `fail-undescribed-property`, `fail-undescribed-attribute`, `fail-undescribed-event`, `fail-undescribed-slot`, `fail-undescribed-css-part`, `fail-undescribed-css-property`; pass: `pass-repository`, `pass-reordered`; breaking: `break-not-json`, `break-missing` |
| `plants` | Plants | `pnpm run gate:plants` (CI: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` after the helper jobs `plants-plan` and `plants-shard`) | `gates/plants/` only, and the registry check | registry plants in `gates/plants/plants/`: a gate without an entry, a gate without a CI job, `--skip-container` in the plants job (`fail-skip-container-in-ci`) or in plants-shard (`fail-skip-container-in-shard`), `--shard` in the plants job (`fail-shard-in-plant-check`); pass: a matching pair, the three plant jobs (`pass-split-plant-jobs`) |

The plant job (`gates/bin/plants.ts`) first checks that `gates/gates.json`, the gate jobs of
`.github/workflows/ci.yml` and the FR-020 list are one set, then runs every plant through its gate in normal mode on
a temporary repository built from the plant and the repository's own configuration (only the inputs are swapped;
since 002 the configuration set also holds the token source `packages/tokens/src/source.ts`, its overrides
`overrides.ts`, the generator `generate.ts` and the pair list `packages/tokens/contrast/pairs.json`, so a plant sees
the real token source and carries only the files it changes), and fails when a fail plant is not caught with exactly its expected findings, a pass plant is not accepted, a
breaking plant is not reported as "could not run" for the cause it names, a gate lacks a fail, pass or breaking plant, a `plant.json` is
missing or invalid, or a plant carries gate configuration.

**The split plant job (006 plan decisions 23 and 24).** `gate:plants` has three modes besides the single run (every
plant in one process, the registry check first), which stays what runs locally:
- `--plan` prints the shard numbers as one JSON line, `[1,2,…,n]`. Shard 1 holds every plant of the gates other than
  `visual` and `axe`, and the registry's plants; then come the `visual` plants by name in groups of at most 8, then
  the `axe` plants the same way (`plantShards` and `shardSize` in `gates/lib/plant-runner.ts`; 8 is provisional).
- `--shard <k>` judges only shard `k`'s plants as the single run would, with no registry or structural check, prints
  `plants: shard <k> of <n>: <m> plants judged, every plant as expected`, and writes the report
  `storybook/.visual/plant-shards/<k>.json` whatever its exit.
- `--verdict <dir>` runs the registry check and the structural checks of the whole set, recomputes the partition, and
  exits 2 for a shard with no report, a report that is not one or names another plan, a report whose plants are not
  exactly its shard's, and a skipped or not-run plant. Otherwise it prints the reports' problem lines, or the single
  run's summary line.

In CI the job `plants-plan` ("Plants plan") prints the plan. The matrix job `plants-shard` ("Plants shard") first
prints the free disk (`df -h /`), removes the runner's unused toolsets and prints it again, then judges one shard each under both engines and uploads its report
(`plant-shard-<k>`), and on failure its captures (`plants-<k>`). The job `plants` ("Plants", the required check) runs
after them, always: it downloads every report and gives the verdict. `plants-plan` and `plants-shard` are the plant
job's helper jobs, not gates. The registry check fails (`skip-container-in-ci`) when a step of any of the three jobs
passes `--skip-container`, and (`shard-in-plant-check`) when a step of `plants` passes `--shard` or `--plan`, since
the required check would then judge one shard or none. Every mode prints each plant's time on stderr,
`note: plant time: <gate>/<case>: <seconds> s`, and the summary line is unchanged.

**Plant deltas and keyed locations (002).** A `repo-tree` plant never carries a copy of the token source or the pair
list, nor a line-based patch of them: it states its change in `delta.json`, by key, so a change to a neighbouring
token or entry cannot break it (002 contracts/gates.md § Configuration set). `tokens` is a list of token overrides
(`{ "token": "color-ink-muted", "light": "#6B655A" }`, `{ "add": { … } }`, `{ "remove": "<name>" }`), written as the
`overrides` list of the tree's `packages/tokens/src/overrides.ts`, which `source.ts` applies to its records; `pairs`
sets fields of, removes or appends pair-list entries by key `(theme, fg, bg)`; `pairsList` replaces the whole pair
list with one fixed text, for a breaking plant whose input is a list that cannot be checked: `"empty"` writes the text
`"[]\n"`, `"not-json"` the fixed text `"[\n  {\"theme\":\"light\",\n"` (both as JSON strings; the second does not
parse as JSON); any other value, a delta with both `pairs` and `pairsList`, and any part not named here are errors, so no plant
carries a copy of the list or other free text (operator decision R1-01 (c)); since 005, `manifest: "absent"` (its one
value) removes the committed `packages/elements/custom-elements.json`, which the configuration set holds, for the
manifest gate's breaking plant `break-missing` (a tree then must not hold the manifest); `generator: "wrapped"`
moves the real `generate.ts` to `generate.real.ts` before the plant's `tree/` places a `generate.ts` that must
`export * from "./generate.real.ts"` and may shadow one function. A plant's `tree/` must not hold `source.ts` or
`pairs.json`, holds `generate.ts` only with `generator: "wrapped"`, and holds `overrides.ts` only without `tokens`;
an unknown token name or pair key, or a broken rule of these, fails the plant job naming the plant. A `contrast` or
`brand-rules` fail plant writes each expected location by key: `packages/tokens/contrast/pairs.json#<theme>/<fg>/<bg>`
(the line of that entry), `packages/tokens/src/source.ts#<name>` (the line of the token's record),
`packages/tokens/src/overrides.ts#<name>` (a token only an override adds) or `packages/tokens/dist/tokens.css#<text>`
(the first line holding the text in the stylesheet the plant tree's generator makes); the plant runner resolves each
to `<path>:<line>` in the plant's built tree before judging, and a key that resolves to no line (or a token or pair
key to two) fails the plant job naming it.

A plant's `plant.json` holds only what the plant expects (`expect`, `why`, `findings`, `records`, `cause`) and, for a
fail or breaking plant that presents its gate another base than its temporary repository's base commit, `base`: the
plant runner puts it in place of `{base}` in the gate's plant command. Every breaking plant names its `cause`, a
substring of a line the gate prints on its error output when it exits 2, so a breakage for another reason fails the
plant job; `cause` on a fail or pass plant, and `base` on a pass plant (which could then pass vacuously), make the
`plant.json` invalid (contracts/plants.md). The mutation plant `error-unresolvable-base` uses it to present
a `--base` that does not resolve in the temporary repository (contracts/plants.md, mutation row). It is an input of
the gate, like the plant's files, not gate configuration.

The mutation gate exits 2 rather than pass changed code it did not check. That covers a changed path Stryker cannot
take verbatim as a `mutate` input, checked before Stryker runs, and a `mutate` entry Stryker reports it did not read
(`Glob pattern "<entry>" did not result in any files.`). Stryker 10.1.1 never reads a file under a folder named
`node_modules`, `.git`, `.next`, `.nuxt`, `.svelte-kit` or `.stryker-tmp`, in any case. The cause names each such
path or entry (contracts/gate-cli.md, mutation row; phase 3 round 12, O12-01). A changed file that Stryker read but
its report does not list has no mutant on its changed lines and passes.

Since mission 007 (2026-11-10, `specs/007-mutation-gate-strictness/contracts/mutation-output.md`), the gate also prints
what no test was seen killing on changed lines, after the equivalent records and before the findings: one
`<path>:<line>: mutation: timeout: <mutator>: replaced by <replacement>` line per Timeout mutant, one
`<path>:<line>: mutation: compile-error: ...` line per CompileError mutant, and one
`<entry>: mutation: zero-mutants: no mutant on the changed lines` line per entry with no mutant on its changed lines
(the path, or the `--files` entry as given, `path:start-end` for a range). Its summary counts the three, also when
zero. These are reports to read, not findings: they change no exit code, and the plant judge never counts them as
findings; a mutation plant may assert them with `reports` in its `plant.json` (contracts/plants.md). A `--files` list
that names one file more than once is exit 2, since one file's entries never share a shard.

## The Storybook scope of `csp` and `prefix` (002 FR-023)

The Storybook (`storybook/`, a private workspace, nothing of it published) is held to constitution IV with two
exceptions the operator took (002 plan.md, Complexity Tracking; reviewed when #10 extends this Storybook):

- **The Storybook page's header.** The page is the preview, `iframe.html`, served with constitution IV's CSP plus
  the host additions `font-src 'self'` and `connect-src 'self'` (it fetches `index.json`):
  `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'`. The manager UI
  (`index.html`) cannot run under it (its Emotion and React `<style>` elements; 002 reviews/phase-3/spike.md), so it
  is not the page and `frame-src` is not added. The build does not ship it: the build script passes
  `storybook build --preview-only` (operator decision R1-01, 2026-11-04), so `storybook/dist/` holds no
  `index.html`, no `sb-manager/` and no `sb-addons/`, and the run-time test asserts their absence and opens
  `iframe.html` only. The run-time test `storybook/test/integration/csp.test.ts` serves the
  whole build under that header, asserts the header, zero violations (with a control), no request outside the origin,
  each story's tokens, and no monospace element (with a control). The package output gets no addition.
- **The narrowed static scope.** This narrows SPEC-1-05's "no style attribute remains in the built output": the
  static gates read this repository's Storybook inputs before bundling and the HTML entries of the build output as
  `storybook/scripts/externalise.ts` leaves them, not the bundles. Vite compiles Storybook's own preview runtime
  into the preview bundle (with `Function(...)` calls and `<span style=...>` strings), so no static fence separates
  vendor code from this repository's code there; every bundle under `storybook/dist/` (the preview bundle and the
  files `externalise.ts` moves out of the HTML) is left to the run-time test.

| Gate | Storybook files in scope (outside `node_modules`) | Rules |
|---|---|---|
| `csp` | `.ts`, `.js`, `.css`, `.html` below `storybook/stories/`, `storybook/.storybook/` (with its HTML head template), `storybook/scripts/`, `storybook/.generated/`; and `storybook/dist/*.html` | `.html`: the markup rules. `.ts`: parsed as TypeScript (`ScriptKind.TS`), the dynamic-code rules and the markup rules on every string and template literal holding a `<`, as for built JavaScript; a `.ts` file that does not parse is exit 2. **Exception**: in `storybook/scripts/` the markup rules do not apply to literals, because the externaliser names the `<script>` and `<style>` tags it moves; the dynamic-code rules still apply, and the HTML entries it leaves are checked. `.css`: read and counted. Package source (`packages/*/src/`) stays outside the gate. |
| `prefix` | every covered text file below `storybook/` except `storybook/dist/`, which contributes its top-level `*.html` only | as for the packages. The Storybook UI theme (`.storybook/manager.ts`, `fontBase` and `fontCode`) is checked by `storybook/test/unit/theme.test.ts`, and rendered fonts by the run-time test, which uses the gate's exported `monospaceFamilies` |

## Required checks on `main`

The workflow that runs on a pull request is the pull request's own `ci.yml`, so only a list kept outside the branch
makes a gate block the merge. The ruleset (or branch protection) on `main` requires exactly these fifteen checks:

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
12. Contrast
13. Brand rules
14. Custom-elements manifest
15. Plants

A change to this set is a change to the ruleset, which the operator makes. The jobs `mutation-plan` and
`mutation-shard` serve the Mutation testing check and are not required themselves. `mutation-plan` splits the changed
files into entries, a file of more than 60 changed lines into line-range entries `path:start-end` of at most 60
changed lines, and fills them into shards of at most 10 entries and 250 changed lines (FR-013); two entries of one
file never share a shard, so no shard holds more than 60 changed lines of one file, while an entry may share a shard
with other files' entries. The entry bound is 60 changed lines, down from 120 (operator decision, 2026-11-05, phase 5
round 6 of mission 002: the shard `packages/tokens/src/generate.ts:121-240` held 264 mutants and took 670 s; research.md
R-08). A cut is the boundary between two consecutive entries of one file. A mutant whose node
spans a cut (starts in one entry of a file and ends in the next) is mutated in no shard, since Stryker mutates a node
only when it lies wholly inside one `mutate` range; the smaller mutants inside it, each within one entry, still are.
This is an accepted limit (operator decision, phase 3 round 10, O10-02; research.md R-08, "Cuts, an accepted limit").
Amendment 2026-11-11 (mission 007, spec FR-014): the entry bound is now 30 changed lines, for every file. A file of
more than 30 changed lines is split into entries of at most 30 changed lines, so no shard holds more than 30 changed
lines of one file; the 10-entry and 250-line shard bounds and the rule that two entries of one file never share a
shard stand (operator decision, 2026-11-11, "30-line entries, all files": with the TypeScript checker on, three of
the four 60-line entries of `packages/tokens/src/source.ts` took 188 s, 251 s and 283 s on the sandbox against
mission 007's bound of 176 s; `specs/007-mutation-gate-strictness/evidence/README.md`).
`--plan` reports the number of shards and of cuts it made on stderr, in one line,
`mutation: plan: <s> shards, <c> cuts within files (...)`, and the JSON on stdout stays the one array the job
reads. Each `mutation-shard` job passes its shard's entries unchanged to `--files` and runs under a 10-minute limit. `.github/workflows/cache.yml`
(cache warming on `main`) is not a gate.

## Deferred gates (FR-026)

These gates of the constitution are not delivered by this feature; each is delivered with the issue named:

| Gate | Delivered by |
|---|---|
| Storybook build | #10 |
| Visual regression | #10 |
| Accessibility (axe) | #10 |
| Remote loads in built output (constitution IV, beyond FR-021) | the first element feature |
