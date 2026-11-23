# Landing: second merge of `origin/main` stopped on a design clash

`git merge --signoff origin/main` at branch head `43bf955` with `origin/main` at `13af7a9` (mission 011, layout and
headers, #44; mission 008, overlays, #47), merge base `23ba5c5`. 37 files conflicted. The merge was not
committed: it was aborted (`git merge --abort`), and the tree is the branch head's, clean.

## The clash: how the manifest generator treats an element's internal base class

Both missions changed `packages/elements/scripts/manifest.ts` and `packages/elements/custom-elements-manifest.config.mjs`
to handle an element that extends an internal (non-`ocelle-*`) base class, and they chose opposite designs, each pinned
by tests and recorded in its mission's spec.

| | Branch (mission 010, PLAN-CORRECTNESS-1-004, FR-034, #27; T030, T036) | Main (mission 008, research.md R-01, operator decision "analyse, then drop it", 2026-11-14; T018, T024, T032) |
|---|---|---|
| Which bases are read | Every local module a class extends (found by a first analyzer pass), e.g. `src/form-control.ts`; config glob `src/*.ts` | `src/overlay.ts` only, by name; a base in any other file of `src/` is **not** read; config globs `src/ocelle-*.ts`, `src/overlay.ts` |
| Inherited members and attributes | Folded onto the element **without** `inheritedFrom` | Listed on the element **with** `inheritedFrom: { name: "OcelleOverlay", module: "src/overlay.ts" }` |
| `superclass` of the element | Replaced, along the chain, by the first superclass in a package or element module (`LitElement` from `lit`); nothing names the base's source | Kept as the analyzer writes it (`{ name: "OcelleOverlay", module: "/src/overlay.ts" }`) |

The tests that cannot all pass under one generator:

- Main, `packages/elements/test/node/manifest.test.ts`, "reads every src/ocelle-*.ts and src/overlay.ts, and nothing
  else: a base in overlay.ts gives inherited members, one in helper.ts does not": pins `ocelle-beta` (a subclass of a
  base in `src/helper.ts`) with **no** members or attributes, and `ocelle-alpha`'s members with `inheritedFrom`.
  Main's dialog (T018) and drawer (T032) entry tests pin `open`, `label`, `closeLabel` and their attributes with
  `inheritedFrom`.
- Branch, same file, "folds the base's public members and attributes into the element's entry ... and adds no module,
  superclass or inheritedFrom naming the base's source" (T030): a base in `src/base-control.ts` **is** read and folded,
  the superclass is `LitElement`, and the manifest does not mention `base-control`. And `fold(raw)` (T036): "drops
  inheritedFrom from every list, and replaces a superclass in a dropped module by that class's own".

With the branch's generator, main's `helper.ts` case gains members and the overlays lose `inheritedFrom` and their
`OcelleOverlay` superclass; with main's, the form controls lose every member of `src/form-control.ts`. Making one side
pass means rewriting the other side's pinned assertions, which the landing may not do (no test weakened). A combined rule
(for instance: `overlay.ts` with `inheritedFrom`, every other base folded without it) would still fail main's
`helper.ts` assertion and is a new design neither mission's spec records. This is an operator decision.

The rest of the generator merges cleanly: the standard-attribute list is a union (the branch's
`aria-label`, `role`, `hidden`, `form`, `aria-invalid`, `aria-required`, `aria-disabled`, `aria-description`; main
keeps `aria-label` only, and no attribute main's elements declare has one of the added names).

## The other conflicts (not resolved; no clash seen on a first read)

`gates/bin/contrast.ts` and `packages/tokens/src/source.ts` differ only in pinned counts in comments (branch 165/173,
154 required; main 169/177, 158 required: the union is base + both missions' additions). The remaining conflicts are
lists and counts of the kind resolved in the first merge (`merge.md`): `packages/elements/src/index.ts`,
`package.json`, `README.md`, `CHANGELOG.md`, the gates' contrast and integration tests, `gates/test/manifest.test.ts`,
`gates/plants/visual/fail-token-changed/plant.json`, the generated manifest plant copies, the elements test harness
(`browser/driver.ts`, `browser/serve.ts`, `commands.ts`, `in-process.ts`, `scenarios/driver.ts`, `entry-root`,
`exports`, `node/manifest`, `node/readme`), `storybook/test/integration/elements-stories.test.ts` and
`vitest.config.ts`. The harness files were not read in depth, so a second behavioural clash there is not excluded.

## Decision needed

Which rule the merged generator follows for an internal base class, and which side's pinned tests (and spec text)
change to match. Once decided, the merge can be redone with the method of `merge.md`.
