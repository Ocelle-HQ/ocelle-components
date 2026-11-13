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
- `config-unreadable/` (`TERM=linux`) and `config-unreadable-unicode/` (`TERM` unset): recorded at landing
  (operator round `specs/006-storybook-workbench/reviews/phase-2/round-2.md` O2-02, landing L1-03) from a scratch root
  (`git archive HEAD`, the repository's `node_modules` and `storybook/node_modules` linked) whose
  `storybook/.storybook/main.ts` is `const config = {;`: Storybook cannot evaluate its configuration and names
  `MainFileEvaluationError`, no story file. Same command and environment as above; paths substituted the same way.
