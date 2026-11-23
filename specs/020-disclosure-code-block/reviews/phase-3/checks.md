# Phase 3 checks (T041)

The quickstart run (`quickstart.md` steps 1 to 4) and the SC-007/SC-008 scope diffs, read with the operator's
CI-first decision (`reviews/operator-ci-first.md`): locally only the fast gates, the affected plant run and the tests
the phase changes; the heavy runs are CI's required checks. Run on 2026-11-21 on the phase 3 working tree (the README
edits of T040 and T042 applied), branch head c13c3c5 before the phase commit.

## Quickstart

1. **Element tests.** The phase changes no test and no element. Run locally: the README test, which reads the edited
   README, in its project, `pnpm exec vitest run --project elements-node`: 6 files, 781 tests passed. Left to CI: the
   disclosure and code-block bodies in process and on the built build (`--project elements --project elements-browser
   disclosure code-block`) and the full `pnpm test` (the Unit tests check). Phase 2's `check-head.log` holds the full
   suite at its head (8153 passed); no source or test has changed since.
2. **Manifest.** `pnpm --filter @ocelle/elements run manifest && git diff --exit-code -- packages/elements/custom-elements.json`:
   no diff (exit 0).
3. **Gates.** Run locally, each with no finding:
   - `gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`
   - `gate:lint`: `lint: 459 files checked, no finding`
   - `gate:style-lint`: `style-lint: 43 files checked, no finding`
   - `gate:test-lint`: `test-lint: 338 files checked, no finding`
   - `gate:manifest`: `manifest: 22 elements checked, no finding`
   - `gate:config-copies`: `config-copies: .specify/extensions/story/story-config.yml and tooling/speckit/extensions/story/story-config.yml are identical`
   - `gate:prefix`: `prefix: 486 files checked, no finding`
   - `gate:csp` after `pnpm -r run build` (exit 0): `csp: 48 files checked, no finding`
   - `gate:signoff --range <phase base>..HEAD` after the phase commit: see § Signoff below.
   - `gate:plants -- --affected <phase base>`: no plant selected (`plants.md`).

   Left to CI: `gate:contrast` (no token or colour changed), `gate:mutation` (sharded, op 015; no source changed) and
   the full plant set (CI's Plants check). The element plants of contracts/checks.md were run in phase 2
   (`reviews/phase-2/plants.md`, all bite); no source changed since, so none was re-run.
4. **Stories.** Left to CI: `gate:storybook-build`, `gate:axe` and `gate:visual` over the full Storybook. No story or
   baseline changed in this phase, so no `visual:update` was run and docker was not needed; no podman cross-check was
   possible in this environment either.
5. By hand (optional): not done.

## SC-007 and SC-008: scope diffs

Branch base 8ebbe439b08562e3832fbe996645d4ff714f0874 (`reviews/phase-2/operator-019.md`; phase 1's range was checked
against 4911fd0b by T013). Both commands were run at c13c3c5 and the phase's own edits touch none of these paths.

```text
$ git diff --name-only 8ebbe439b08562e3832fbe996645d4ff714f0874 HEAD -- packages/elements/src/overflow-region.ts specs/009-workflow-layouts/contracts packages/elements/src/focusable.ts packages/elements/src/overlay.ts packages/elements/src/ocelle-fact.ts packages/elements/src/ocelle-facts.ts packages/elements/src/ocelle-empty-state.ts packages/elements/src/ocelle-progress.ts packages/elements/src/spinner.ts packages/elements/src/rosette.ts storybook/stories/facts.stories.ts storybook/stories/empty-state.stories.ts storybook/stories/progress.stories.ts ':(glob)packages/elements/test/**/*fact*' ':(glob)packages/elements/test/**/*empty-state*' ':(glob)packages/elements/test/**/*progress*'
(no output, exit 0)
$ git diff --name-only 8ebbe439b08562e3832fbe996645d4ff714f0874 HEAD | grep -iE "fact|empty-state|progress|spinner|rosette|overflow-region|focusable|overlay|009-workflow"
(no output, grep exit 1: no changed path matches)
```

- SC-007: `src/overflow-region.ts` and its contract (`specs/009-workflow-layouts/contracts/`) are unchanged since the
  branch base.
- SC-008: no file of mission 013's elements (`ocelle-facts`, `ocelle-fact`, `ocelle-empty-state`, `ocelle-progress`
  and their `spinner` and `rosette` modules; their stories, scenarios, in-process and fixture tests, fixtures and
  baselines) changed. Mission 019 is not on this branch, so it has no file to diff; its shared-file conflicts are the
  known gaps `operator-019.md` lists, for /ocelle-land.

## Phase 2 plants.md cleanup (phase 2 review R1-07)

`reviews/phase-2/plants.md` had an empty `text` block (lines 13-14). The stopped run's output was not kept, so it
cannot be filled: the block was removed and the paragraph after it now says the output was not kept. Nothing else in
that record changed.

## Signoff

`pnpm run gate:signoff --range e39524c54f643a19315489db7c19f9773e1bf5a9..HEAD` before the phase commit:
`signoff: 2 commits checked, no finding`. The phase commit is made with `git commit -s`; the run over the range with it
is reported by the implementer, and CI's Signoff check judges it.
