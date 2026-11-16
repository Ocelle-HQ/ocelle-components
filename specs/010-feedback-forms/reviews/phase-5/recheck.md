# Phase 5 recheck: research R-08 against #10 as merged (FR-033)

- **Date**: 2026-11-13
- **Compared against**: `main` at 3828d2f (Mission 006, #10), merged into this branch at 8c53b7a
- **Sources read**: `storybook/README.md`, `gates/lib/story-page.ts`, `specs/006-storybook-workbench/research.md`
  (R-04, around lines 140 to 180), `contracts/gates.md`, `contracts/container.md`, plant
  `gates/plants/visual/pass-focus-below-fold`

| Item | R-08 | #10 as merged | Result |
|------|------|---------------|--------|
| Story location | `storybook/stories/<element>.stories.ts` | same | match |
| Render helper | `storybook/stories/render.ts`, no inline styles | same | match |
| Pointer parameter | story pointer parameter (006 FR-031) | `parameters: { ocelle: { pointer: { hover \| press: "<selector>" } } }` | match |
| Baseline naming and command | `storybook/baselines/<story-id>.<theme>.png`, `pnpm run visual:update` | same | match |
| `closed-shadow-root`, `outside-root`, `font` rules | as 006 | same | match |
| Focused states | `autofocus` on the host | kept focus and hidden caret proven only for a story that focuses by script after render (the plant's element calls `.focus()`); `autofocus` not proven | differs |
| Select `:focus-visible` ring after programmatic focus | not covered | not measured | open |

**Phase 5 tasks**: no task ID or phase heading changes.

**Decision** (operator, 2026-11-13): R-08 is updated now. Focused-state stories focus the element by script after
render, the `pass-focus-below-fold` pattern (a wrapper element defined in the story file whose `connectedCallback`
calls `.focus()`), not `autofocus`. The select's `:focus-visible` ring after a programmatic focus is measured when its
stories are written (T064); if it does not show, the implementer stops for the operator. Updated: research R-08, plan
decision 6 and its "Recheck when #10 landed" paragraph, tasks T060, T063, T064 and the stop-and-ask list, and the spec
assumption that named the pre-merge branch.

**T060**: still merges `main` before `base.sh 5`. If #10's harness files change on `main` after 3828d2f, T060 repeats
this comparison for those changes and appends the result here.

**T060, 2026-11-16**: `main` not merged, by operator decision (`decision-t060-merge.md`; the merge is deferred to
landing). The recorded base `77dfda1` (`base.sha`) holds #10's harness (`3828d2f` and the merge `8c53b7a` are its
ancestors; `storybook/README.md`, `gates/lib/story-page.ts` and the plant `pass-focus-below-fold` present) and the
elements of phases 2 to 4 (`src/ocelle-notice.ts`, `src/form-control.ts`, `src/ocelle-form-input.ts`,
`src/ocelle-form-select.ts`). Since `8c53b7a` the branch has not changed `storybook/`, `gates/lib/story-page.ts` or
`gates/lib/capture-plan.ts`; the local `origin/main` ref (`c4c0af4`, not fetched again) changes none of them after
`3828d2f`, and its only `specs/006-storybook-workbench` change is op 016's `affected-in-ci` amendment to
`contracts/gates.md` and `contracts/plants.md`, which touches no R-08 item. The comparison above stands; no phase 5
task changes.
