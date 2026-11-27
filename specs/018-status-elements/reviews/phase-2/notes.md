# Phase 2 notes (implementer): User Story 1, `ocelle-status-indicator`

## Commits

- `c082789d` scaffold: `src/status.ts` (signatures, `statusOf` always `"neutral"`, `statuses` empty) and
  `src/ocelle-status-indicator.ts` (the class only, no registration), so the red tests fail on their assertions.
- `2e6138e3` red: T011 to T017 (operator decision I3: story tests, scenario bodies, node tests, token expectations and
  pinned counts in the red commit).
- `585492b1` green: T018 to T022.

## Red record

`red.sh 2 phase` on `2e6138e3`: `tests_only: true`, `red: true`, exit 1, **146 of 7870 tests failed**
(`red-phase.log`), each on the missing behaviour:

- `status.test.ts`: `statusOf` reads `"neutral"` for every value and `statuses` is empty (the scaffold's neutral values);
- `status-indicator.test.ts` and its fixture twin: the element is not defined, so the bodies read no dot, no ring and no
  run (`seek`/`advance` reject with "no `[part="ring"]` in the shadow root"; in process the browser command's
  rejection reads `Error: empty`), or a tree without the image node;
- `consumers.test.ts`: no `[part="dot"]`;
- entry, root and export tests: the element is not defined or exported;
- tokens: `expected.ts` names `size-indicator` and `motion-pulse` the source lacks (index, source table, JSON, browser
  values and themes, the font test's "every token's value", the README and CHANGELOG lists, the 136-token pin and the
  four zeroed durations); `generate.test.ts` on the repository's source; `gates/test/brand-rules.test.ts` on the
  repository's source (the dropped `--ocelle-motion-pulse: 0ms` line is not there, so the gate passes where the
  finding is expected);
- node: manifest (members, attributes, parts), README section and rules (i) to (viii), CHANGELOG names and statements,
  the entry-points table and `package.json` exports; build and pack (the module's imports, the root's import, the
  browser build's definition, the `exports` entry);
- story and gate counts: the two story ids, the token stories' Size and Motion lists, 196 stories, 392
  story-themes, 394 axe plant runs, 21 manifest elements;
- `gates/test/integration/vitest-mutation-config.test.ts` ("starts source-table.test.ts first"): it counts the modules
  started after the tokens source-table group, and that group fails in the red commit (its 136-token pin), so the run
  stops after it. A consequence of the red token tests, not a test of this phase; it passes in green.

## The driver additions

`advance(id, inner, ms)` (a run's current time set without pausing it, so a run can end within a body in a fraction
of a second; `seek` pauses) and `moveBefore(id, parentId)` (the state-preserving move), in `test/animations.ts`
(`advanceOf`, `moveBeforeOf`, self-contained page functions) and both drivers. They are in the red commit as test
code; each body that uses them pairs them with a positive read (`advance` with a current time at or past the time it
set; `moveBefore` with a remove-and-insert twin that starts a new run), and `advance` rejects when there is no run, so
neither can pass silently. `driver.module()` was not used for these: on the fixture it serves one URL, `/module.js`,
which the page's module map caches after the first import.

## Points for the review

- **US1-8, the element's internals.** contracts/checks.md § US1 bodies asks that the element's internals (role, name,
  `ariaHidden`) follow `label` alone. The element keeps its internals in a private field, so the body reads Chromium's
  tree instead: the four combinations of a present or blank host `aria-label` with and without `label` give exactly
  the spike's stand-in tree (`spikes.md` § R-03, US1-8), and after the `aria-label` is removed each equals its twin
  without one; an `aria-label` set later on an unlabelled indicator leaves it hidden. The plant "the element reads
  `aria-label`" fails this body (below), since reading it would name the unlabelled indicators and hide the
  blank-labelled one.
- **Runs that end while hidden.** A run that ends inside a closed `<details>` or under `hidden="until-found"` can still
  be listed as `finished` until the content is shown (the spike read it so); those two reads count the runs that are
  not finished. On opening or reveal none is listed, as the spike measured.
- **`label` and `pulse` defaults.** The manifest declares them `undefined` (unset), following the repository's
  convention for reflected optional properties, where contracts/elements-status.md writes `""` and `false`; unset,
  empty and false behave the same (decorative; no ring). Initialising them would make Lit write `label=""` or rewrite
  a host's `pulse` attribute at upgrade.
- **Story capture.** The Tones story's second row carries `pulse`; under #10's reduced-motion capture it shows the
  solid dot, as R-12 says. The `fail-token-changed` plant gains `elements-ocelle-status-indicator--tones/light` (its
  state names are text in `color-ink`; the Labelled story has no text); this line is not yet confirmed by a plant run
  (see `plants.md`).

## Guard plants (T023), each run once in process (`test/status-indicator.test.ts`), the source restored after each

| Plant (contracts/checks.md § US1 bodies) | Change to `src/ocelle-status-indicator.ts` | Result |
|---|---|---|
| the ring re-created on every render | the ring wrapped in `keyed(Math.random(), …)` | 2 failed: the listed-change body (tone, label, theme read a new run) and the same-task toggle (new ring node) |
| the ring kept when `pulse` is removed | the ring rendered whatever `pulse` is | 4 failed: US1-1 (a run and a ring without `pulse`), the "removing pulse stops the run" body, the same-task toggle and the listed-change body's twin |
| the element's `animation: none` rule removed | the `prefers-reduced-motion: reduce` block deleted | 2 failed: the own-rule body (a run under `reduce` with the host rule restoring 1600ms) and the reduce/no-preference body |
| `aria-label` read by the element | `accessibleName(this.label, this.getAttribute("aria-label"))`, `aria-label` observed | 1 failed: US1-8 |
| `:host([hidden])` removed | the rule deleted | 1 failed: the edge-case body (the hidden host keeps its 8 px box) |

The first run of the `keyed` plant reported "no tests" (Vite discovered the new `lit/directives/keyed.js` import and
reloaded); the second run is the one recorded.

## Gates (T023)

Node 26.13.0 (`/opt/node26/bin` first on PATH), `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
one heavy job at a time:

- `gate:typecheck`: no type error; `gate:lint`: 462 files, no finding; `gate:style-lint`: 43 files, no finding;
  `gate:test-lint`: 341 files, no finding; `gate:manifest`: 21 elements, no finding; `gate:prefix`: 475 files, no
  finding; `gate:pins`: 5 manifests, no finding; `gate:contrast`: 207 pairs light, 215 dark (196 required per theme,
  unchanged); `gate:brand-rules`: 7 rules checked; `gate:config-copies`: identical.
- `gate:csp`: 46 files checked, no finding (after building `@ocelle/tokens` and `@ocelle/elements`; 41 before the
  build, from the dist already on disk).
- `gate:storybook-build`: built 196 stories. `gate:visual` (docker): 392 captures match their baselines (docker only:
  no cross-engine comparison). `gate:axe`: 392 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10
  excepted), the existing prose-document exceptions.
- `pnpm test` (= `gate:unit-tests`), dockerd running: `unit-tests: 7870 tests passed in 241 files`, exit 0.
- `gate:mutation -- --base b48309ce…`: the first run found one survivor, `ocelle-status-indicator.ts`
  `if (name === "tone") this.requestUpdate();` with the condition replaced by `true` (equivalent: `label` and `pulse`
  are Lit properties whose change already requests the same coalesced update). The call was made unconditional, as
  `ocelle-brand-mark`'s is (no behaviour change; the in-process, fixture and entry tests pass again). Second run: 47
  mutants on the changed lines of 4 files, none survived; 15 compile errors, 1 zero-mutant entry (`index.ts`).
- `gate:signoff`: on the commit range, after this commit.
- Plants: not judged, stop-and-ask (`plants.md`).

## Baselines

Written only by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container: 8 files (4 added, the
two indicator stories in light and dark; 4 changed, `tokens--size` and `tokens--motion` in light and dark, which list
the two new tokens). None was hand-edited or hand-picked; no podman cross-check is possible here.
