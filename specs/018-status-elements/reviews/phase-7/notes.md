# Phase 7 notes (implementer): Polish & Cross-Cutting Concerns

## Commits

- No scaffold: the phase adds no module.
- `50b72071` red: T063's README pins in `packages/elements/test/node/readme.test.ts`, T063's text in tasks.md naming
  the `slotchange` pin (operator decision Q-F1 (c); phase-6 round-2 note R2-01), and `reviews/phase-7/base.sha`
  (`bd40cf30`).
- green: T063 to T065 (the commit that adds this file).

## Red record

`red.sh 7 phase` on `50b72071`: `tests_only: true`, `red: true`, `recorded: true`, exit 1, **6 of 8325 tests failed**
(`red-phase.log`, sandbox paths redacted). All six are the new bodies of `readme.test.ts` § "the status elements
together (018 phase 7)", each an `AssertionError` on a README sentence the base does not have:

- the intro: "This release has twenty-three elements:" and the clause naming the three status elements;
- the `ocelle-status-indicator` section: the shared status vocabulary and the link to `ocelle-pill-tag`;
- the `ocelle-metric` section: **Beside a state.**, linking to the indicator and the pill;
- the `ocelle-pill-tag` section: the indicator's `tone` taking the same five values;
- § Control conventions: the interactive `ocelle-pill-tag` following the conventions.

No syntax, import or setup error. The other 8319 tests, the 018 scenarios in process and on the CSP fixtures
included, passed in that run; none of the timing flakes named by the operator appeared.

The first `red.sh` run (same commit) failed 11 of 8325: the same six plus five `gates/test/integration/visual.test.ts`
bodies that exited 2 because the Docker daemon had stopped (`docker info`: cannot connect). After restarting dockerd
and `pnpm run setup:online`, `red.sh` was run again on the same commit; that second run is the recorded one.

### The `slotchange` pin (Q-F1 (c)), which cannot fail at this phase's base

The pin of the README sentence on the pill's `slotchange` stop ("In button and link mode, where `ocelle-tooltip` wraps
the inner control, a `slotchange` of the pill's slots stops at the pill, a forwarded slot's included: … A static pill
lets it bubble on") is in the red commit, but it **passes** there: phase 6's fix (`5a871ac2`) wrote the sentence, so it
is already in the README at this phase's base `bd40cf30`. No README text of phase 7 could make it go from red to green.

The rule followed is the one the skills give for a test whose code is already right (speckit-story-fix step 3, the
precedent of phase 6's R1-01 pin, `reviews/phase-6/check-build-pin-on-base.log`): the stronger test goes in as it is,
and its non-vacuity is shown by running it against the code from before the change it pins. `check-slotchange-pin-
before-sentence.log` runs the red commit's `readme.test.ts` against the README of `62b78799` (phase 6's fix-1 red
commit, the parent of the fix that wrote the sentence): **7 failed, 777 passed**: the six red bodies above and the
`slotchange` pin, each an `AssertionError` on the missing sentence. The pin was not weakened to make it fail, and the
README sentence was not removed and re-added to manufacture a red.

The phase as a whole still passes the red/green check by its six other bodies (red at `50b72071`, and against the base
in `tdd-check.sh`'s final-tests run); the `slotchange` pin's own evidence is the log above, not `red-phase.log`.

### tdd-exempt.md (T064): not written

T064 asked for `reviews/phase-7/tdd-exempt.md` (documentation only). With T063's pins the phase has a red commit with
tests, so it is not documentation only, and `tdd-check.sh` reads an exemption only while `red-commits` is empty
(`tdd-check.sh`: `if [[ -f "$dir/tdd-exempt.md" && ! -s "$dir/red-commits" ]]`). An exemption covering only the
records (checks.md, research.md, this file) would change nothing in the check and could be read as exempting the
README change, which is tested. So no `tdd-exempt.md` is written, T064's text is amended to say so, and the expected
result of `tdd-check.sh 7` is `pass` (not `exempt`): the red commit is red, the final `readme.test.ts` fails against
`bd40cf30` (the six bodies), and the tests pass at HEAD.

## Tasks

### T063: README, Engines, CHANGELOGs

- **Cross-links.** The indicator section now says its five tones are the vocabulary the pill's `status` shares, and
  links to `ocelle-pill-tag` for a state shown as text (FR-002). The pill section says the indicator's `tone` takes
  the same five values, for a state shown as a dot. The metric section gains **Beside a state.**: a metric shows a
  value, not a state, with links to the indicator and the pill. § Control conventions gains a sentence naming the
  interactive `ocelle-pill-tag`, in button and link mode; the pill section's existing "(see Control conventions)"
  link back is pinned as well. The control conventions' own rules and the `ocelle-button`, `ocelle-action-row` and
  `ocelle-tooltip` sections are unchanged.
- **The intro (found during T063).** The README's opening paragraph still read "This release has twenty elements"
  and did not name the three status elements, though their sections and entry points were in. It now reads
  twenty-three and names them. Pinned by the first two red bodies.
- **§ Engines, against T001 (b).** Unchanged. The three elements use constructable stylesheets, `ElementInternals`
  (roles and custom states), ARIA element reflection, `ResizeObserver`, `MutationObserver`, `Range` boxes,
  `delegatesFocus`, `assignedNodes`, the `lh` unit, `@media not (forced-colors: active)` and
  `prefers-reduced-motion`. Each is at or below the floor Chromium 135 / WebKit 17.4 that § Engines states and
  `reviews/phase-1/recheck.md` § Engine floor recorded (R-14). No feature is newer.
- **CHANGELOGs.** Reviewed. No change was needed.
  - `packages/elements/CHANGELOG.md` § Unreleased / Added names each surface change of
    contracts/elements-status.md once, in the bullet of its element:
    - the three elements and their entry points;
    - the indicator's `tone`, `label`, `pulse` and its parts `dot` and `ring`;
    - the metric's `label`, `display-value`, `layout` and its parts;
    - the pill's attributes, its default and `icon` slots, its parts `pill` and `control`, its moved attributes with
      their mirrors, `focus()`, `click()`, `ocelle-pill-tag-activate` and its states `pressed` and `current`.
  - Phase 6's corrected entry, that the pill's entry point also defines `ocelle-tooltip`, appears once in Added
    ("(defines `ocelle-pill-tag`, and the `ocelle-tooltip` an interactive pill renders)"). It also appears once in
    the Unreleased summary paragraph ("also defines `ocelle-tooltip`: a minor change"), which is the release's
    summary paragraph, not a second Added entry. The source comment at `ocelle-pill-tag.ts:74-75` agrees.
  - `packages/tokens/CHANGELOG.md` names each of the four new tokens once in Added:
    - `--ocelle-size-indicator`;
    - `--ocelle-motion-pulse`. Its second mention is the reduced-motion bullet, a different fact;
    - `--ocelle-line-height-snug`;
    - `--ocelle-target-small`.

    Each token also has one summary paragraph.
- **The pin (Q-F1 (c)).** See above.

### Items deferred to Polish by earlier reviews

- **Phase-4 R1-03 (contracts/checks.md:80, the dropped-override plant's reason): still open, fixed.** The reason
  column now says the plant is caught because the icon-only pill hangs below the line (top −4.00 px, as with `bare`
  never set). It says the wrappers' block-starts stay equal, because `.icon-slot { align-self: flex-start }` keeps the
  icon at the row's start. It also says the plant must sit after the slot convention's styles. Sources:
  `phase-1/spikes.md` § Notes for later phases and `phase-4/notes.md`.
- **Phase-3 R1-02 and R1-03 (research.md R-05's wording): still open, fixed.**
  - R-05 now says the eyebrow's size, weight and tracking are set on the `dt`, and the `.eyebrow` span carries the
    uppercase transform and the colour.
  - R-05 now says the value's family is set by the element (`.metric { font-family: var(--ocelle-font-sans) }`),
    not inherited from the base styles.
  - Both are marked "amended in phase 7".
- **Phase-6 Q-P6-1 (a)** (the three rules left out): done in phase 6's fix-1 (phase-6 round 2, R1-03 resolved). Nothing
  left for phase 7.
- **Phase-5 R1-04** (items deferred to phase 6): carried by phase 6 (T056, T059). Nothing left for phase 7.
- The 008 triage point of phase-6 R1-05 (the tooltip reads `event.target`, not its own slot) is the orchestrator's
  item for 008, not a phase-7 task; nothing was filed.

### T064: the quickstart and SC-001 to SC-006

Environment: Node 26 first on PATH, `OCELLE_CHROMIUM_PATH` set, dockerd running (restarted once, see above).
`reviews/operator-ci-first.md` limits the local gates, so the quickstart's heavy steps are left to CI, as noted below.

| Quickstart step | Outcome |
|---|---|
| `gate:typecheck`, `gate:lint` (481), `gate:style-lint` (45) | no finding |
| `pnpm run test` | the full suite ran at the red commit `50b72071` (`red-phase.log`), whose source equals HEAD's: 8319 of 8325 passed. The 6 failures are the phase's README pins, which pass at HEAD. `vitest --project elements-node` at HEAD: 846 passed |
| `gate:manifest` (23 elements), `gate:csp` (48 files), `gate:prefix` (511 files) | no finding |
| `gate:contrast`, `gate:brand-rules` | exit 0: 207 pairs in light and 215 in dark (196 required per theme); 7 rules |
| `visual:update` | not run: no story changed in this phase |
| `gate:storybook-build`, `gate:visual`, `gate:axe` | not run locally (operator-ci-first.md; no story or style changed in phase 7). CI judges them. The unit suite's story and baseline counts passed in the red run |
| `gate:plants -- --affected <phase 2's base>` | every plant selected through an unmapped path; recorded with `--list` (plants.md) |
| `gate:mutation` | exit 0, nothing to mutate since `bd40cf30` (mutation-phase.log) |
| By hand in Chromium | not done in this session, which has no interactive browser. Each item is pinned by a scenario that passed in the red run: the pulse's three runs and its end (US1-4), the tooltip on hover and focus and Escape (US5), the written label in the tree (US2-2), the two find matches (metric find-in-page body), the `<details>` case (§ US1 bodies), the baseline and the grid cell (§ US3 bodies) |

| Criterion | Checked against | Outcome |
|---|---|---|
| SC-001 | `test/consumers.test.ts` over `scenarios/consumers.ts`: the indicator, metric and pill rows (checks.md § Scenarios) | passed in the red run |
| SC-002 | 21 stories (indicator 2, metric 3, pill 16) with 42 committed baselines, light and dark, counted in `git ls-files`; axe | baselines complete; visual and axe judged by CI (not run locally) |
| SC-003 | `gate:contrast` | exit 0 in both themes |
| SC-004 | `scenarios/status-indicator.ts` (US1-4 to US1-6, § US1 bodies), in process and on the CSP fixture | passed in the red run |
| SC-005 | `scenarios/pill-tag-interactive.ts` (US4) and `scenarios/pill-tag-truncation.ts` (US5), both harnesses | passed in the red run |
| SC-006 | `test/node/manifest.test.ts` and `gate:manifest`; `gate:csp`, `gate:prefix`, `gate:lint`; mutation of the changed source | manifest test and gates pass. Phase 7 changes no source, so mutation has nothing to mutate. Phases 2 to 6 each recorded an exit-0 mutation run, and CI's Mutation check judges the pull request's range |

### T065: gates, plants, mutation

- Fast gates at the green tree: as in the table above, plus `gate:test-lint` (358), `gate:config-copies` (identical)
  and `gate:pins` (5 manifests). `gate:signoff` over `bd40cf30..HEAD` is run after the green commit (see the
  report).
- **Plants.** Run against phase 2's base `4fc2ed5b` with `--list` (`plants.md`). It selects 317 of 317 plants,
  because `packages/elements/package.json` is not mapped. Per `reviews/operator-plants.md`, none is judged locally and
  CI's Plants check judges every plant.
- **Mutation.** `gate:mutation -- --base bd40cf30`, alone: "nothing to mutate: no package or gate source line changed
  since bd40cf30", exit 0 (`mutation-phase.log`).
