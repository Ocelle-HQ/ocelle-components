---
phase: 5
round: 1
verdict: approved
base: d15962bfbf11a7ed9f30a5fbe8fc4b80766e6751
head: ca5a14fc2d2174a4f4b27f4b4a44e089186029f6
tdd_check: pass
---

# Phase 5 review, round 1

Scope: `git diff d15962b..ca5a14f` (red 940dce2, green 2a32ba8, evidence ca5a14f). No uncommitted change. Changed
files: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES`, `.github/CODEOWNERS`,
`gates/test/governance.test.ts`, `tasks.md` (T084 to T090 ticks only) and the phase-5 evidence files. Nothing outside
the phase was changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | gates/test/governance.test.ts:57-67 | The test does not assert the FR-032 parts beyond SC-006: "what to include", "not through an issue" and "MUST NOT ask for public issues". SC-006 and T084 do not require them, and the file meets them on reading (SECURITY.md:5, :9-10, :12-21). | None. |
| R1-02 | note | gates/test/governance.test.ts:54-56 | Only `.github/CODEOWNERS` is checked. A second `CODEOWNERS` at the root or in `docs/` would not be caught; none exists, and GitHub reads `.github/` first, so the effective owner is still the one asserted. | None. |

No blocking finding.

### Requirement check (against the files)

- **FR-030**: `LICENSE` is 11358 bytes, SHA-256 `cfc7749b…3d30`. I downloaded https://www.apache.org/licenses/LICENSE-2.0.txt
  independently; `cmp` reports it byte-identical.
- **FR-031**: CONTRIBUTING.md:9 "There is no contributor licence agreement", :13 `git commit -s`, :16 `Signed-off-by`
  example, :25 the constitution path, :28-40 the Spec Kit flow. The root commit `d08d413` exemption it states matches
  spec.md:180 and gates/bin/signoff.ts:24.
- **FR-032**: SECURITY.md:7-8 GitHub private vulnerability reporting, switched on at 1.0.0 (#11); :9-10 `@MOES-Media`
  (the CODEOWNERS owner) directly and privately, not through an issue; :5 no public issue, pull request or discussion;
  :12-19 what to include; :25-27 3 and 10 working days.
- **FR-033**: THIRD_PARTY_NOTICES states that no third-party asset ships yet and that the Schibsted Grotesk (OFL 1.1)
  entry arrives with #5. `git ls-files packages` shows no file other than .ts/.json/.md/.css, so "only those" holds.
- **FR-034**: no secret, token or personal data in the new files. The only e-mail address is the placeholder
  `you@example.com` (CONTRIBUTING.md:16); `@MOES-Media` is a public handle, allowed by FR-034.
- **FR-035**: `.github/CODEOWNERS` has exactly one rule, `* @MOES-Media`. No other CODEOWNERS file exists.
- **R-17**: files and the test location (`gates/test/governance.test.ts`, run by `pnpm test`) match. The GitHub-side
  owner validation belongs to the operator (plan.md § Verification) and is out of scope here.
- **SC-006**: every clause has an assertion (names at the root, sign-off strings, sole owner, the reporting route,
  the handle, 3 and 10 working days).
- **Constitution** (Technology, Licence and Supply Chain, lines 147-160): Apache-2.0, `THIRD_PARTY_NOTICES` for the
  font, and `SECURITY.md` with a private channel before going public, all present. Element principles (prefix, I/O,
  tokens, a11y, CSP) do not apply: no package source changed.

## Test quality

- **Red evidence**: 940dce2 changes only `gates/test/governance.test.ts`. `red-phase.log` shows all 8 tests failing
  with AssertionErrors for the missing files (empty-string hash `e3b0c442…`, `expected '' to contain …`, `expected []`),
  not setup errors.
- **No weakening**: `git diff 940dce2..HEAD -- gates/test` is empty.
- **Not vacuous**: a missing file reads as "" and fails its assertions. I probed a copy of HEAD in a scratch
  directory: one word changed in `LICENSE` (1 test fails), `SECURITY.md` renamed to `security.md` (3 fail), an extra
  owner in CODEOWNERS (1 fails), an extra CODEOWNERS rule (1 fails), "3 working days" changed to "5" (1 fails). No
  conditional assertions, skip/only, mocks or snapshots. The name check uses `readdirSync` of the root, so it is
  case-exact.
- **Acceptance scenarios**: scenarios 1 to 3 are covered by tests; scenario 4 ("no asset that does not ship") is
  checked by reading (see FR-033 above).
- **Mutation**: `pnpm run gate:mutation -- --base d15962b` exit 0: "nothing to mutate: no package or gate source line
  changed since d15962b". That is correct, since the phase changes only a test and text files.

## Checks run

At ca5a14f in /home/user/ocelle-components:

- typecheck, lint, style-lint, test-lint, config-copies, csp, prefix, pins: exit 0.
- signoff `--range d15962b..HEAD`: 3 commits checked, no finding.
- `vitest run --project gates`: 39 files, 1051 tests pass, including the 8 governance tests.
- **Could not run here**: the full `pnpm test` (browser projects) and `gate:plants`. This sandbox has no Chromium
  build 1248 and the proxy blocks `cdn.playwright.dev`, so both report "could not run: Chromium not found". All 10
  plant problems are that message. These are environment limits, not findings. The evidence for these checks is
  `check-head.log` (unit-tests: 1108 tests passed in 52 files at 2a32ba8) and the orchestrator's report that CI run 6
  (head 2a32ba8) succeeded. I did not query GitHub.

## Earlier findings

None. This is round 1.
