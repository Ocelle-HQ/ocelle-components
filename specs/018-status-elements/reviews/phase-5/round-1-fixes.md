# Phase 5 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | `fix-1 22a403aa` (red-commits; red-fix-1.log: exactly the new body fails, in process and on the fixture, 2 of 8243 tests) | packages/elements/src/ocelle-pill-tag.ts `#modeChanged()`, `#control()`; packages/elements/test/scenarios/pill-tag-interactive.ts "US4-10, focus before the first render"; packages/elements/test/browser/pill-tag-interactive.test.ts (allowed list) |
| R1-02 | fixed | none: not a behaviour finding (the plant run itself) | reviews/phase-5/plants.md; tasks.md T055 |
| R1-03 | fixed: by operator decision (a) (reviews/phase-5/operator-decisions.md § R1-03 revisited): the disable is kept and its comment extended to say it also covers the killed `false` mutant, which US4-12 and the line's `EqualityOperator` mutant still cover. Before that decision: Stryker 10.1.1's directives select by mutator name and line only (its directive pattern is `Stryker (disable\|restore) [next-line] <names>`); the equivalent `true` and the killed `false` are both the `ConditionalExpression` of the one `if` test on line 498, so no comment can suppress the one without the other. The operator was asked how to proceed (below) | none: not a behaviour finding | packages/elements/src/ocelle-pill-tag.ts:498 |
| R1-04 | fixed | none: tracking only (Principle VIII: the items stay untested source until phase 6 observes them) | tasks.md T056, T059 |

## R1-01

The red body runs four cases in one shared scenario, so both harnesses read them, with focus on `#before` before each:

- a connected static pill given `interactive` and then `href` in one task (static → button → link before any render);
- a connected static pill given `href`, `interactive` and no `href` in one task (the reverse switch, link → button);
- a pill made by `document.createElement` with `interactive`, appended and given `href` in the same task;
- a pill made with `interactive` and `href`, appended and its `href` removed in the same task.

Each reads the focus path, the pill's focused inner element and its rendered control. At the red commit all four moved
focus to the pill's new inner control (`s1[a]`, `s2[button]`, `n2[button]`; `n1` lost it to `n2`, made in the same
module). On the fixture the body also showed a second defect on the same path: a switch on a pill not yet connected
threw `Cannot read properties of undefined (reading 'querySelector')` (Lit attaches the shadow root at the first
connection, and `#control()` read `this.renderRoot`), reported on the console the fixture asserts empty.

Fix: the refocus is recorded only when a rendered inner control holds focus (`this.#control()?.matches(":focus") ===
true`), and `#control()` reads `this.shadowRoot?.querySelector(...) ?? null`, null before the first connection.

The created pills go through the driver's `module()`; the fixture serves it as the same-origin `/module.js`, so the red
commit adds `module.js` to that page's allowed requests (as personal-rail.test.ts has it). The fixture caches a module
by its one URL, so both created pills are made in one module, each in that one task.

The first red run (`e30f1895`, before the allowance was amended in) also failed `dialog.test.ts` "Rapid toggle during
the entry", a timing body outside this phase; the recorded run of `22a403aa` fails only the two new tests.

## Mutation (R1-01, R1-03)

`gate:mutation -- --base <base> --files packages/elements/src/ocelle-pill-tag.ts:495-540` (mutation-fix-1.log):

- run 1: 48 mutants on the changed lines; 1 survivor, `ocelle-pill-tag.ts:522` `if (previous === next) return;`
  replaced by `false`. Before the fix it was killed only through the defect (a same-mode change on an unrendered pill
  took focus); with the fix, its one observable effect is `capture()` on a static pill whose mode stays static.
- a body added to the shared scenarios for it, "FR-035, no mode change": a static pill with `title` and `aria-label`
  given an `href` that is not a link (`""`, then whitespace) keeps both on its host with no mirror and renders no inner
  control. It passes on the code (the code is right; it strengthens the tests).
- run 2: 48 mutants, none survived; 2 timeouts (lines 495, 504), 13 compile errors (among them the optional-chaining
  and `?? null` mutants of the two fixed lines, which strict TypeScript rejects); 1 equivalent record, line 498.

## Operator question (R1-03), decided (a)

Stryker 10.1.1 cannot suppress only the `true` replacement of line 498. Which should apply?

- (a) Keep the disable as it is, its comment extended to say it also covers the killed `false` replacement (the
  behaviour of `connected()` on a static pill stays covered by US4-12 and by the line's `EqualityOperator` mutant,
  which is not disabled and is killed).
- (b) Drop the condition: call `adoptMirrors()` at the upgrade in every mode (the equivalence shows `connected()` adds
  nothing there), so no mutant needs a disable; a source change, with the US4-12 bodies as its guard.
- (c) Restructure the upgrade branch so that the equivalent replacement is a separate node on its own line (a shape
  chosen for the mutation tool, not for the reader).
- (d) Other.

## Plants (R1-02)

See plants.md: `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected <base>`, run with the working tree
holding the whole fix, after `docker info` (server 29.9.2): exit 0, 116 of 317 plants judged, every plant as expected.
T055's plant part is closed on that run.

## Checks run

PATH with Node 26 first, `OCELLE_CHROMIUM_PATH` set; per reviews/operator-ci-first.md:

- `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest`, `gate:config-copies`,
  `gate:csp`, `gate:prefix`, `gate:pins`, `gate:contrast`, `gate:brand-rules`, `gate:signoff -- --range <base>..HEAD`:
  no finding;
- vitest `elements`: pill-tag-interactive, pill-tag, control, button, action-row: 5 files, 359 passed;
- vitest `elements-browser`: browser/pill-tag-interactive, pill-tag, button, action-row: 4 files, 279 passed;
- `gate:mutation` on the changed lines (above); `gate:plants -- --affected <base>` (plants.md).

`ocelle-button` and `ocelle-action-row` are unchanged.
