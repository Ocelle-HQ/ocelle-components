---
scope: landing
phase: landing
round: second-opinion
verdict: approved
base: 1d599fd4f5be62f4f1257cd6dab4a764c3e3b785
head: 5819d321
---

# Landing second opinion (PR #105, mission 018-status-elements)

This is a fresh review of the integrated diff `git diff 1d599fd4...HEAD` at 5819d321. It covers `ocelle-pill-tag`,
`ocelle-status-indicator` and `ocelle-metric`, the 012 helper extensions in `src/control.ts`, the tokens, the exports,
the manifest, the changelogs, the main-merge resolutions and the landing folds L-01 and L-03. `ocelle-button` and
`ocelle-action-row` are out of scope, except for the regression check on `control.ts` below. I did not use the
earlier phase reviews as evidence. Nothing was pushed, no code was changed and GitHub was not touched.

## Verdict

**approved.** I found no blocking finding. The five findings below are notes.

## What was checked, and how

- **Source.** I read all of `src/ocelle-pill-tag.ts`, `src/ocelle-status-indicator.ts`, `src/ocelle-metric.ts` and
  `src/status.ts`, and the `control.ts` diff (`capture()`, `release()`, `adoptMirrors()`, and `guardHost`'s `active`
  predicate). I compared them with spec.md FR-001 to FR-043, data-model.md and contracts/elements-status.md. I traced
  these paths by hand and found no defect in any of them:
  - every mode transition (static, button, link), at upgrade and after it, including attributes written by the element
    itself, which re-enter `attributeChangedCallback` (`ocelle-pill-tag.ts:545-597`, `control.ts:111-156`);
  - the mirror round-trip, including `adoptMirrors` for a pill that is static at upgrade;
  - the precedence of the accessible name (`:706-710`);
  - `pressed` only in button mode, and `current` (`:754-762`);
  - a disabled link: no `href`, `role="link"`, `aria-disabled` (`:724-726`);
  - truncation measured with RTL (`:126-136`);
  - the indicator's `expose` (`ocelle-status-indicator.ts:160-162`) and its reduced-motion and forced-colours rules
    (`:83-116`);
  - the metric's `dt`/`dd` with a visually hidden copy of the label (`ocelle-metric.ts:247-253`, `:324-327`).
- **Tests run at HEAD** (Chromium 1248, in process):
  - The 12 018 suites and `control.test.ts` (pill-tag, pill-tag-interactive, pill-tag-truncation, status-indicator,
    metric, status, entry-root, exports, the three entry tests): 261 passed.
  - 012's `button.test.ts` and `action-row.test.ts`, with no change to their files in the diff: 210 passed. FR-030's
    requirement that 012's behaviour stays unchanged holds.
  - Node: `packages/elements/test/node/*` (manifest, readme, changelog), `gates/test/vitest-config.test.ts`,
    `ci-workflow.test.ts`, `manifest.test.ts` and `brand-rules.test.ts`, and the tokens readme, source-table and
    generate tests: 1526 of 1527 passed. The one failure was `timing-setter.test.ts`, which timed out at 5 s under
    load. It is not 018 code, the diff does not touch it, and it passed alone.
- **Exports.** `src/index.ts:44,53,60` add the three classes in code-point order (`OcelleListbox` < `OcelleMetric`,
  `OcellePersonalRail` < `OcellePillTag`, `OcelleSkipLink` < `OcelleStatusIndicator` < `OcelleTab`).
  `package.json:57-59` adds the three entry points. `build.test.ts` checks each module's imports and the browser build.
- **Merge resolutions.** `e465bfbc` (main 1d599fd4) merged cleanly: `git show --remerge-diff e465bfbc` is empty and
  main's #103 touches only tooling. The conflicted merge was the earlier `dfa6bc09` (main 64c57578). I read its
  `--remerge-diff`:
  - The pinned counts are consistent with the tree. There are 838 baselines (`ls storybook/baselines | wc -l`), main's
    796 plus 42 new PNGs. There are 419 stories, main's 398 plus 21 (16 pill-tag, 3 metric, 2 indicator). There are 52
    manifest elements, 49 plus 3. The axe notes stay at 132, so the new stories add no incomplete result.
  - `vitest-config.test.ts` takes the union of both command lists, and `vitest.config.ts` registers the four new
    commands.
  - Both drivers keep both sides' commands (`browser/driver.ts` imports).
  - The CHANGELOG keeps main's 010, 019 and 020 entries and adds 018's after them.
  - `visual.test.ts` takes main's split into `visual-capture`/`visual-findings`, both at 838.
  - `runs/index.md` is in order.
  - No conflict marker is left in the tree.
- **Sandbox paths and personal data.** No `/home/user`, `/root/` or scratchpad path appears in an added line except
  where a rule forbids such paths, or as the `/tmp/dockerd.log` operator recipe. Logs redact the root to `<repo>`
  (`reviews/landing/red-l01.log:3`). The only e-mail addresses are pre-existing `example.com` fixtures and the
  `noreply` trailer, and every commit author is `Claude <noreply@anthropic.com>`.
- **L-01.** The pin moves first, in `0672d63d`: `gates/test/vitest-config.test.ts:89` reads 45. It is red against 30,
  as `reviews/landing/red-l01.log:9-24` shows. The raise follows (`dbf7de88`, `stryker.elements.config.json:10`), then
  the README (`gates/README.md:237`). `gates/test/ci-workflow.test.ts:64-68` still requires the shard job limit (75) to
  be above the dry-run limit. The stryker config is the only place the value is set.
- **L-03.** `c19eb084` adds one body (`test/scenarios/pill-tag-interactive.ts:1161-1204`). It counts adopted sheets per
  root with `perRoot[0]`, which counts duplicates, against `distinct - 1`. Pills `b` and `l` hold the interactive
  sheet throughout, so the subtraction is sound. It also reads the host's `display` after nine steps on five pills.
  The plants table (`reviews/landing/plants-l03.md`) and `mutation-l03.log` (58 mutants, none survived) back it.

## Findings

1. **note.** The spec gives the indicator's and the metric's `label` and `pulse` a property default of `""` and
   `false` (FR-010, spec.md:516-517; data-model.md:24-25; contracts/elements-status.md:17-18, 33-34). The source
   declares them unset, so `el.pulse` and `el.label` read `undefined` before anything is set:
   `ocelle-status-indicator.ts:126,135` (`@default undefined`), `ocelle-metric.ts:293,302` and `ocelle-pill-tag.ts:419`.
   The manifest records `boolean | undefined` with no default (`custom-elements.json:6311-6316`, `6350-6357`). The
   attributes behave as specified, and every rendering path treats `undefined` as empty or off. This is the
   repository's own convention (`ocelle-card.ts:100`, `ocelle-disclosure.ts:158`, `ocelle-code-block.ts:163`,
   `ocelle-data-table.ts:123`). But the contract table and the manifest disagree on what the property reads.
   Suggested: a follow-up that aligns the contract's Default column with the convention ("unset"). No code change.

2. **note.** A static pill still measures for truncation on every default-slot `slotchange`.
   `#onSlotchange` (`ocelle-pill-tag.ts:641-645`) calls `#measure()` in every mode, and `#measure()` requests an extra
   update when the full text changes (`:651-660`). data-model.md:93-94 says the truncation listeners, `slotchange` on
   the default slot among them, "exist iff connected and mode ≠ static". A static pill renders no tooltip, so nothing
   wrong can be seen: the only effect is one extra Lit update per text change. As `plants-l03.md` records, this extra
   update is what hid the line-765 mutants from the "follows the mode" body after phase 6, so it has already cost one
   kill. Suggested: guard the measure with `this.#modeNow() !== "static"`, or amend data-model.md. This is a follow-up
   and need not block the landing.

3. **note.** L-03 has no operator-decision entry. `reviews/operator-landing.md` records only L-01 (line 5) and L-02
   (line 32). The landing fold L-03 is recorded in `reviews/landing/plants-l03.md` and cited in
   `reviews/phase-4/round-5.md:18,59` (R5-04). It is test-only (`c19eb084`) and changes no element, so it needs no
   operator choice. For the retrospective, either add a one-line L-03 entry to `operator-landing.md` or state there that
   L-03 is a reviewer-scoped fold.

4. **note.** The dry-run headroom will shrink. Main alone already took 30 min 25 s (operator-landing.md:19-22), and
   this branch takes 32 min 36 s. With the cap at 45 min, about 12 min of headroom remains, and the element shard's
   75-minute job keeps about 30 min for mutants (operator-landing.md:24-26). At about 2 min per mission's worth of
   element tests, the next few element missions will reach the 45-minute cap again. This does not block 018, but a
   standing fix such as sharding the dry run or splitting the elements project belongs on the roadmap rather than
   another raise.

5. **note.** The merge that needed conflict resolution is `dfa6bc09`, not `e465bfbc`. The task brief names
   `e465bfbc` as the main merge, but that merge was clean (empty `--remerge-diff`). The resolutions I reviewed are
   those of `dfa6bc09`, the merge of main 64c57578 (#101), listed above. All of them are correct. I record this only so
   that the landing record names the right commit.
