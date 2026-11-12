---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 64c61d9
head: b47bc88
tdd_check: pass
---

# Landing review, round 1 (PR #26, mission 005-icons-brand-mark)

This is a fresh second opinion on the integrated diff `origin/main...HEAD` (`64c61d9...b47bc88`): 340 files, about
19,600 added lines, most of them spec and review records. `main` is one commit ahead (op 004, #22). Outside the
generated `knowledge/speckit-flows/runs/index.md` it only touches `packages/tokens/src/source.ts` (it drops the
`as const` wrappers), its test and records, and nothing in this diff reads those lines differently. I used the phase
reviews as input: phases 1 to 5 are all approved at their latest round, and every `tdd-check.json` is `pass` (phases 1
and 3 also have a reasoned `tdd-exempt.md`, which I accept). This review looks for what they missed. The open notes
of the phase rounds are not raised again, for example phase 3 R1-01 on `byCodePoint`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | specs/001-repository-foundation/contracts/ci-checks.md:12-27, :48-56 | **The CI-checks contract does not know about the new gate.** The first table has no `Custom-elements manifest` row. Line 50 still says the gate job ids are "thirteen in all", and lines 53-56 still say the ruleset requires "the fourteen check names of the first table" and that `gates/README.md` "lists the same fourteen names". In fact `gates/README.md:118`, `gates/lib/registry.ts:4`, `gates.json` and `ci.yml` now have fifteen checks and fourteen gate ids. Mission 002 updated this contract when it added `Contrast` and `Brand rules` (lines 58-61, 002 landing L1-02). The landing completeness baseline names this file, and no gate compares it, so nothing else will catch the drift. | Add the row `Custom-elements manifest` / `pnpm run gate:manifest (job id manifest; since 005)`. Change "thirteen in all" to fourteen (naming 005 FR-009's `manifest`) and "fourteen check names" to fifteen. Add a 005 paragraph like 002's: the ruleset on `main` must add `Custom-elements manifest`, and until it does the gate does not block a merge. |
| L1-02 | note | gates/stylelint/token-only.ts:91-111 (`admittedLine`) | **The `1lh` rule lets a factor through when `1lh` sits alone in parentheses.** `admittedLine` checks the neighbours of `1lh` only inside its own group. A group that holds nothing but `1lh` has no neighbours there, so it passes, and the operator that applies to the group is never checked. Reproduced with `rawValues`: `padding-block: calc((1lh) * 3 + var(--ocelle-space-1))` gives `[]`, and so does `calc(calc(1lh) * 3 + var(--ocelle-space-1))`, while `calc(1lh * 3 + var(--ocelle-space-1))` gives `["1lh"]`. research.md R-03 (lines 111-115) says "a factor written directly on `1lh`" is closed. It names as open only "a factor applied to a parenthesised group that holds `1lh` beside a token". `(1lh) * 3` is in effect the first case, so the code does less than R-03 claims. Nothing that ships uses this form (`iconSlotStyles` has `calc((var(--ocelle-icon-size) - 1lh) / 2)`), and the README leaves the documented gap to review. So this is a note, not a fail-open in shipped CSS. | Optional, cheap: when the group of `1lh` holds only that length, take its neighbours in the enclosing group. Add a fail plant (for example `fail-lh-paren-factor`) and a red unit case. Otherwise, add this spelling to R-03's "not closed" list. |
| L1-03 | note | packages/elements/custom-elements.json (`modules[].path`, `exports`); packages/elements/package.json:13-22 (`files`) | **The manifest points to files the package does not ship.** Each module's `path` and its `js` export name `src/ocelle-icon.ts` and `src/ocelle-brand-mark.ts`. The re-export of `IconName` names `module: "./icons.ts"`, which is relative to the module, not the package. `files` ships `dist/` and not `src/`. The manifest also has no `custom-element-definition` export, because registration goes through `define()` and not a direct `customElements.define`, so the analyzer cannot see it. Tag names, members and attributes are right, and that is what Storybook and the editor custom-data tools read. But a tool that maps a tag to the module to import (auto-import, go-to-definition, lazy loaders) would get a path that is not in the tarball. The manifest is public surface under constitution I, and the package is unpublished at 0.0.0, so a fix now costs nothing in compatibility. | Follow-up (an issue, offered to the operator): in `normalise`, map `src/<name>.ts` to `dist/<name>.js` (and `./icons.ts` likewise), and add a `custom-element-definition` export per element, with a test in test/node/manifest.test.ts. Or record why the source paths are intended. |
| L1-04 | note | packages/elements/README.md:231, :243 | The package README, which ships in the tarball, still has two planning IDs: "(FR-006)" and "(FR-034)". The landing prose rule allows no FR-/T0/R- IDs in package-facing docs. The CHANGELOG has none. | Drop the two parentheticals (test/node/readme.test.ts does not pin them). |

## Gate boundaries and the exit contract

- **`manifest` (new).** Exit 2 when the committed manifest is missing or not JSON (`committedManifest`). Exit 2 also
  when `generate` rejects: no `src/ocelle-*.ts` under the root, or the analyzer throws. Every other input is judged.
  A JSON value that is not a manifest (`null`, `[]`) has no elements, so each generated element is reported "not in
  the committed manifest" (exit 1). A difference outside the six member kinds falls back to one whole-file `stale`
  finding, so no difference passes unreported. The `no-description` check reads the generated manifest, so it cannot
  be satisfied by hand-editing the committed file. The plants cover `stale` (a property with its attribute, a lost
  attribute, an element-level reorder that must pass), all six `no-description` kinds, and both breaking cases.
  `gates/test/integration/manifest.test.ts` runs the gate from another directory on a built plant tree, so a
  generator that cannot resolve the analyzer from a plant tree fails there. It does not overlap with style-lint: that
  gate reads the manifest's `cssProperties` names, and this gate keeps those names current.
- **`style-lint` / `token-only`.** `scale`, `aspect-ratio` and `1lh` are handled before the general classifier.
  `scale` and `aspect-ratio` check the whole value, so every function spelling (`calc(2)`, `var()`) is raw. I probed
  `scale: 2`, `200%` and `calc(2)` (raw); `+1`, `1 1 1` and `none` (pass, all a flip or the identity);
  `aspect-ratio: 1 / 1` and `auto 1` (raw); `-1lh`, `2lh` and `calc(var(--ocelle-x) - 2lh)` (raw); and
  `1.0lh` (pass, equal to `1lh`). All match R-03, apart from L1-02. Both `StringLiteral,BooleanLiteral` equivalent
  records (token-only.ts:186, :206) hold. What reaches `classify` there is not a number, `classify` reads the property
  only through `isFont` and `unitless.has`, and `inCalc` only admits the operator words, which outside `calc()` pass
  as identifiers anyway. The `/` of `aspect-ratio` is a `div` node, which `classify` ignores.
- **`mutation`.** The changed files are split by `packages/elements/src/` into two Stryker runs, each of which deletes
  its own report first. A failed run returns exit 2 before any merge of findings. Findings and mutant counts are
  summed. An element-source file that only a non-`elements` project covers is reported (`Survived`/`NoCoverage`), so
  the split fails closed. The four new plants (`pass-element-source`, `fail-element-source-survivor`,
  `fail-element-source-no-coverage`, `fail-mixed-survivors`) pass under `gate:plants`, and would catch a config
  argument that is dropped or swapped. `vitest.mutation.config.ts` excludes `elements`, `elements-build` and
  `elements-browser`. `vitest.mutation.elements.config.ts` keeps only `elements`. `elements-node` stays in the
  default run and kills the mutants of `scripts/manifest.ts` and `vite.browser.config.ts`. The plan for the
  integrated diff is 12 shards. One of them mixes the two configurations, so it runs Stryker twice. Locally the
  whole diff took about 7.5 min for the default run and 4 min for the element run, at concurrency 8. Watch the
  shard times in the first CI run against the 10-minute limit.
- **`pins`.** `approvedBuilds` is an exact-key set (`rs-module-lexer@2.9.0`, `fsevents@2.3.3`). A bare name or another
  version is still a finding (three new fail plants and three unit cases), and a list-form setting still counts every
  entry. So the exception is as narrow as R-16 says, and `001 research.md` records the amendment.
- **`contrast`.** Only counts changed (160/168 pairs, 13 new rows for the mark). The 149 required pairs per theme are
  unchanged, and the counts are pinned in four tests.
- **`plant-repo`.** `packages/elements/src` joins the copied configuration set, and is required. The three element
  files that land in phase 2 may be absent; only `ENOENT` is ignored (`ignoreMissing`). The `manifest: "absent"` delta
  is closed (one value). Its conflict with a `tree/` that holds the manifest is reported, and per-package
  `node_modules` links are made only where they exist. The configuration-name regex now admits
  `stryker.<x>.config.json` and multi-part `vitest.*.config.ts`, so a plant cannot carry its own copy of the new
  configuration files.
- **Registry and docs.** The new gate is in `gates.json`, `fr020` in `registry.ts`, the `ci.yml` job
  (`Custom-elements manifest`, same shape as the other gate jobs, pinned checkout, `persist-credentials: false`), the
  README check list and § Required checks (fifteen), and the "not delivered" table loses its row. The one place
  missing is 001 `contracts/ci-checks.md` (L1-01). **For the operator:** the ruleset on `main` must add the check
  `Custom-elements manifest`. Until then, the gate runs but does not block a merge.

## Design lens: new seams and public surface

- **Entry points** match `contracts/elements-package.md`: the root, one module per element, `./browser.js`, and
  `./custom-elements.json` plus the `customElements` field. `build.test.ts` proves the module build imports only its
  own files and `lit`, and that neither element module imports the root or the other element. It also proves the
  browser build is self-contained with Lit's production build and the banner. `pack.test.ts` proves what ships. The
  internal modules (`define`, `naming`, `icons`, `icon-slot`, `rosette`) are emitted into `dist/` but are not in
  `exports`, so they are not reachable as specifiers.
- **`iconSlotStyles`** is internal: `src/index.ts` does not export it, and no `exports` entry reaches it. That suits a
  convention the README documents for later controls in this repository. If an outside author is ever meant to use
  it, adding an export is a surface decision to make then.
- **`custom-elements.json`**: right in content, but see L1-03 for its paths.
- **Browser build**: `resolve.conditions` pins Lit's production build whatever `NODE_ENV` is, and the banner is an
  output banner, so the minifier keeps it.

## Accessibility and security of the package code

- **Naming.** `accessibleName` and `expose` give one `img` with the name only when the element can draw and is named.
  Otherwise the internals are `ariaHidden` with no role, and a present host `aria-label` decides alone. Both elements
  observe `aria-label` without declaring it, and the generator drops it from the manifest. Icon lookup goes through a
  `Map`, so `name="constructor"` or `__proto__` draws nothing instead of throwing.
- **Forced colours.** Every variant rule of the mark sits inside `@media not (forced-colors: active)`, and in forced
  colours ring and spot are `currentColor`. Icons are `currentColor` throughout. Both have scenarios in the
  in-process and fixture suites (CDP emulation, light and dark palettes; the phase 4 colour-scheme leak is fixed and
  tested).
- **Shadow-root ID rule.** No `id` and no `url(#…)` reference in either template.
- **CSP.** Styles go only through `static styles` `css` templates (adopted stylesheets). There is no `unsafeCSS`,
  `style` attribute or `<style>` element. The fixture serves every response under `default-src 'none'; script-src
  'self'; style-src 'self'; font-src 'self'` and asserts zero violations, no request outside the allowed list and no
  console output in the same test as each positive outcome. The control page shows the collector records a violation.

## Test quality

- **Red evidence.** Every phase has a red commit, plus phase 4's `fix-1`, each with exit 1 on assertions, and all
  five `tdd-check.json` files are `pass`. The phase 1 and 3 exemptions are reasoned, and no test could have failed for
  them. The phase reviews already note that some phase 2 failures at red were missing browser commands rather than
  assertions (phase 2 R1-01). I found nothing new here.
- **Weakening.** The existing tests this diff changes (`contrast*.test.ts`, `plants*.test.ts`,
  `plants-robustness.test.ts`, `token-gates.test.ts`, `registry*.test.ts`, `vitest-config.test.ts`) change only
  pinned counts that follow the new pairs, plants and gate, or add the new files to the copied set. No assertion is
  loosened. `packages/elements/test/sample.test.ts` ("exports nothing yet") is deleted because the behaviour it
  pinned is gone. `entry-root.test.ts`, `entry-icon.test.ts` and `entry-brand-mark.test.ts` replace it with stricter
  checks.
- **Vacuity.** A scan of every added or changed test file finds no `skip`, `only`, `todo`, snapshot, conditional
  `expect` or swallowed error. The element tests share one scenario body between the in-process and fixture drivers,
  and compare one observed object with one expected object. The icon drawings are compared with an independent
  hand-written table (`icons-expected.ts`).
- **Mutation.** `node gates/bin/mutation.ts --base 64c61d9` on the integrated diff (Node 22.23.4, both Chromium paths
  set): **exit 0, 843 mutants on the changed lines of 18 files, none survived, 15 equivalent records**
  (`round-1-mutation.log`). I read each record. The ten `all: process boundary` records (contrast.ts, manifest.ts,
  mutation.ts and plant-repo.ts in gates; scripts/manifest.ts) sit on `import.meta.main` lines or on file-system and
  process calls, each naming the integration test or plant that covers it. The two `token-only` records hold, as
  above. The two `ObjectLiteral` records on `label: { type: String }` are true equivalents (Lit's default property
  options are `type: String`). All are within R-08.

## Checks run

On HEAD `b47bc88`, Node 22.23.4, one heavy job at a time:

| Check | Result |
|---|---|
| `gate:mutation -- --base 64c61d9` (whole integrated diff) | exit 0, 843 mutants, none survived, 15 records |
| `gate:plants` | exit 0, "217 plants of 14 gates and the registry judged, every plant as expected" |
| `gate:manifest` | exit 0, 2 elements checked |
| `gate:style-lint` | exit 0, 12 files |
| `gate:pins` | exit 0, 5 manifests |
| `gate:config-copies` | exit 0 |
| `rawValues` probes (L1-02 and the list above) | as reported |

The orchestrator reports the rest on a scratch merge of `origin/main` into HEAD, and I did not repeat them: typecheck,
lint, test-lint, style-lint, manifest, contrast, pins, prefix, config-copies, build, csp, and `pnpm test` (2519 tests,
120 files). CI has not run: the PR conflicts with `main` in `knowledge/speckit-flows/runs/index.md`, so GitHub starts no
workflow until that merge.

## Earlier findings

This is the first landing round. Every blocking finding of the phase rounds (phase 1 R1-01 and R1-02, phase 4 R1-01) is resolved
in its next round, and I found none reopened.
