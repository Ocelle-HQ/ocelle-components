# Storybook build output fixtures

- `<case>/` (`ok`, `syntax-error`, `syntax-error-imported`, `unresolved-import`, `not-csf`, `empty-index`,
  `type-error-only`, `missing-deps`, `missing-deps-no-verify`): recorded by the phase 1 spike
  (reviews/phase-1/spike.md § 1) with `TERM=linux`, under which Storybook's logger draws ASCII line marks
  (`|`, `!`, `x`, `o`, `T`, `•`, `—`).
- `<case>-unicode/` (`syntax-error`, `syntax-error-imported`, `unresolved-import`, `not-csf`): recorded in phase 3
  with `TERM` unset, as on the GitHub runner (CI runs 43056264356 and 43064614842), under which the logger draws
  Unicode line marks (`│`, `┌`, `└`, `◇`, `●`, `■`, `▲`). Built from the plants `storybook-build/fail-syntax-error`,
  `fail-unresolved-import` and `fail-not-csf`, and for `syntax-error-imported` from the repository's stories with a
  `stories/helper.ts` holding `export const broken = ( ;` imported by `base.stories.ts`.
  Command: `pnpm --config.verify-deps-before-run=false --dir storybook run build` with `CI=true`, Storybook 10.6.5,
  Node 22. Paths substituted as in the spike: the tree's root `/work/root`, the repository `/work/repo`.
