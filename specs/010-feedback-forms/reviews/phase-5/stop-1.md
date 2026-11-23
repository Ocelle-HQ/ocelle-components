# Phase 5 stop 1: the stories move counts pinned in #10's gate integration tests

- **Raised by**: implementer, 2026-11-16, after T060 (`e535c6a`), before the T061 red commit
- **Stop-and-ask points this falls under**: "A story needs a change outside the three story files" (T066; analysis
  C3), and T066's statement that phase 5 changes no file outside `storybook/stories/{notice,form-input,form-select}.stories.ts`,
  `storybook/test/integration/elements-stories.test.ts` and `storybook/baselines/`.

## What I found

#10's `gates-integration` project runs in `pnpm test` (`vitest.config.ts`, project `gates-integration`) and runs the
three Storybook gates on a copy of the repository. Five assertions pin the repository's present story and baseline
count (21 stories, 42 story-themes, 42 baselines):

| File | Line | Pinned text |
|------|------|-------------|
| `gates/test/integration/storybook-build.test.ts` | 55 | `storybook-build: built 21 stories` |
| `gates/test/integration/visual.test.ts` | 116, 120 | test name and `visual: 42 captures match their baselines (docker …` |
| `gates/test/integration/visual.test.ts` | 139 | `visual: 2 findings in 42 story-themes (docker …` |
| `gates/test/integration/visual.test.ts` | 244 | `expect(before.size).toBe(42)` (the baselines directory) |
| `gates/test/integration/axe.test.ts` | 52, 56 | test name and `axe: 42 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` |
| `gates/test/integration/plant-repo.test.ts` | 225 | `expect(repository).toHaveLength(42)` (the repository's baselines) |

Every story phase 5 adds moves these figures. With the planned set (US4 scenario 1: notice 5 tones, 2 sizes, with and
without a heading, announcing = 10; input empty, placeholder, filled, with description, with error, required,
disabled, read-only, focused, hover = 10; select the same without read-only, plus option groups = 10) the figures
become 51 stories, 102 story-themes and 102 baselines. Left as they are, `pnpm test` fails in `gates-integration`
after green, so T065's gates and the phase-end unit-tests gate cannot be green. The axe line's `10 notes` may also
move if a new story gives axe an incomplete result; that is known only after the stories run.

The tasks do not provide for this. T061 names only `elements-stories.test.ts`; T066 says phase 5 changes no other
file; and the tasks' rule is that every test change of a phase is in its red commit (analysis I3, I7), which these
are (all five files match the test pathspec `**/test/**`). The earlier phases handled their pinned element lists
and counts with explicit tasks (T016c, T034b, T052b); there is no such task for #10's story counts.

## Question for the operator

How should the pinned counts be handled?

- **(a)** Add them to the T061 red commit (a T061 addendum like T016c): update the five files to the counts of the
  final story set, and widen T066's file list to name them. In the red commit they fail as the new story
  assertions do (the stories and baselines are missing), and `tdd-check.sh` check 2 would also fail on them at the
  base, which T066 then has to name beside the baseline assertions. The `10 notes` figure would be set to what the
  axe gate reports once the stories run; if it moves, the red commit is amended before green.
- **(b)** Something else (for example, making those tests derive the count from the repository; that changes #10's
  tests beyond a count and is a change outside this mission's design).

## Measured meanwhile (not a stop)

For T064, a scratch check (not committed) on the pre-installed Chromium (`/opt/pw-browsers/chromium-1243`, the host
browser, not the pinned container): a page loading the built `dist/browser/ocelle-elements.js` with one
`<ocelle-form-select>` in a wrapper element whose `connectedCallback` waits for the definition and the element's
`updateComplete` and then calls `.focus()` on it. The inner `<select part="control">` was the shadow root's active
element and matched `:focus-visible`. T064 still measures this in the select's focused story itself, in the
container's capture, when it is written.

## State

T060 is ticked (`e535c6a`). No red commit, no story file and no baseline was written. Phase 5 resumes at T061 once
the operator answers.
