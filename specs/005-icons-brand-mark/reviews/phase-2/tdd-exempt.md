# Phase 2: TDD exemption (T066)

Constitution VIII *Exemption*: a unit with no behaviour may skip the red step if its review states why no test could
fail for it.

- **Exempt: T066** (OP2-01, landing L1-01): the CI-checks contract,
  `specs/001-repository-foundation/contracts/ci-checks.md`, gains the `Custom-elements manifest` row of the first
  table (job id `manifest`; since 005), the gate-id count fourteen (was thirteen), the required-check count fifteen
  (was fourteen) and a 005 paragraph saying the ruleset on `main` must add the check name. The contract is a record,
  not behaviour of the repository's code: no test and no gate reads it. The registry check (research.md R-10, the
  plant job) compares `gates/gates.json`, `gates/lib/registry.ts` and `.github/workflows/ci.yml` with each other, and
  those three already hold the `manifest` gate since T026; `gates/README.md` already lists the fifteen required
  checks. A test that read the contract would be a new check of a spec document, which no task or gate asks for, so
  no existing test could fail for the change. After it, `gate:unit-tests` and `gate:plants` pass unchanged.
- **Not exempt: T064 and T065** (OP2-02). Their red commit is `fix-2` in `red-commits` (`red-fix-2.log`): 3 tests of
  `packages/elements/test/node/readme.test.ts` failed on assertions, the two README statements expected without
  "(FR-006)" and "(FR-034)", and the README case of the new planning-ID check (`[ 'FR-006', 'FR-034' ]`).
