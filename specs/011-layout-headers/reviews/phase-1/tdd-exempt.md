# Phase 1: units exempt from the red step (T008)

Constitution VIII allows a unit with no behaviour to skip the red step when its review states why no test could fail
for it. Phase 1 has a red commit for the units that do have behaviour; the rest are listed here with the reason.

## Not exempt: the red commit

`test(011-layout-headers): phase 1 red — Setup` (recorded by `red.sh` in `red-commits`), after the scaffold
(`scaffold.sha`: `src/slot-state.ts` with its signatures, and the three reader commands registered in
`vitest.config.ts` rejecting "not implemented"):

- **T003** `packages/elements/test/slot-state.test.ts` is the red test of **T005** (`src/slot-state.ts`, R-03).
- **T004** `packages/elements/test/commands.test.ts` is the red test of **T006** (`AxNode.level`, the `scrollWidth`,
  `activeElement` and `textBoxes` commands and their readers in `test/commands.ts`, registered in `vitest.config.ts`;
  R-13).

The red log is `red-phase.log`.

## Exempt

| Unit | What it is | Why no test could fail for it |
|---|---|---|
| T001 | The #10 recheck against R-14, recorded in `spike.md` | A record of what #10 merged; it changes no code, so there is nothing a test could run. |
| T002 | The spike, measured on scratch pages and recorded in `spike.md` | Measurements of the browser that the later red commits depend on; the scratch pages are not committed and no code changes. The facts are tested later by the scenarios of phases 2 to 5 that rely on them. |
| T007 | Driver plumbing: `append`, `remove`, `textData` (light DOM append, remove and text-data change), `tab` (Playwright `Tab` on the fixtures, `userEvent.tab` in process), `viewport` and `size` (viewport and a container's inline and block size) in `test/scenarios/driver.ts`, `test/in-process.ts` and `test/browser/driver.ts`, the driver methods `activeElement`, `scrollWidth` and `textBoxes` that pass on to T006's readers, and the five fixture page templates `test/browser/fixtures/{card,section-header,page-header,context-sidebar,personal-rail}.html` | Each method passes an action on to the DOM, Playwright or Vitest (one call, then the existing `settle`), or forwards a T006 reader that T004 already tests; the fixture pages are the existing page template with a title and load no element of their own yet. None decides anything a test could catch on its own: they are exercised by every scenario of phases 2 to 5 that uses them, where a broken method fails the scenario. `driver.rules`, which the token-sentinel scenarios use for token overrides on `:root`, already exists (005) and is used as it is. |
