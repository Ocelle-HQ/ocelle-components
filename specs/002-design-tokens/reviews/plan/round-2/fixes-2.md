# Squad round 2: fixes 2

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-002 | fixed | contracts/gates.md § Mutation, typecheck and test scope (the existing `tokens` project excludes `packages/tokens/test/browser/**`, as `gates` excludes `gates/test/integration/**`; a second config test resolves every project's `include`/`exclude` against the repository's test files and asserts no test file belongs both to a project `vitest.mutation.config.ts` keeps and to one it excludes); research.md R-03 (glob `packages/tokens/test/browser/**/*.test.ts`, matching contracts/gates.md; *Mutation path* states the `tokens` exclude and the overlap test); plan.md Technical Context (Testing), Constitution Check VIII, Project Structure (`vitest.config.ts`, `vitest.mutation.config.ts`), Phases US1 |
