---
phase: landing
round: 1
reviewer: reviewer-renata
verdict: changes_requested
base: 3d090026a19dd8e2479ff02f2ff9b8161fe00ef1
head: 85356cda27b761300ae4138ea4419f1a82bd906b
tree: a8b90618622afcdf38f4763c1bfef7e5138bbd13
tdd_check: pass
---

# Landing review, round 1 for PR #101

## Blocking findings

### L1-01. Replay accepts a stale main pin

Both `base.sh` copies and `checkPhase` accept any commit ancestral to both `HEAD` and `refs/remotes/origin/main`. This admits a stale main SHA and violates FR-001. [Installed wrapper](../../../../.specify/extensions/story/scripts/base.sh#L16) · [Source wrapper](../../../../tooling/speckit/extensions/story/scripts/base.sh#L16) · [Replay verifier](../../../../gates/bin/story-evidence.ts#L475)

In a disposable repository, I branched at main revision A, recorded a failing phase assertion in `test/phase.test.ts`, and fixed the behavior. Main revision B added `test/main-only.test.ts`. I merged B into the feature and advanced `origin/main` to C, a child of B. `git merge-base --all HEAD refs/remotes/origin/main` returned B. `base.sh 1 --with-main A` exited 0 and wrote A. `tdd-check.sh 1` reported `pass` with base exit 1 and head exit 0, but selected both tests. Pinning B returned the same verdict and selected only `test/phase.test.ts`.

Require the supplied SHA to match the single latest shared main revision at both pin-write and replay time. Accept B when `origin/main` advances to C without another merge. Reject A, a Git inspection failure, and multiple merge bases. Keep the check that excludes the phase's red commits. The wrapper should exit 2 before writing an invalid pin. Replay should report `status: fail` before running tests under its existing report contract.

### L1-02. The runner error summary has no total bound

The shard verifier shortens each error to 500 characters, then joins the entire list. FR-002 requires bounded diagnostics. Passing `verifyTestShard` a matching result with 1, 10, and 1,000 valid runner errors, each with a 600-character message, produced messages of 525, 5,043, and 502,023 bytes respectively. [Shard verifier](../../../../gates/lib/test-evidence.ts#L207)

Bound the runner error summary as a whole and indicate omitted errors. Keep the exact missing and unexpected project/file identities, the actual matrix index, the current formatting for small summaries, and the failed verdict. The complete `result.json` should remain byte-for-byte intact for artifact inspection. [Receipt write](../../../../gates/bin/test-shards.ts#L68) · [Artifact upload](../../../../.github/workflows/ci.yml#L85)

## Gate and workflow review

- The scope guard checks the issued commit range, index, worktree, and non-ignored untracked files. The integration test observes exit 0 for allowed paths, exit 1 with exact JSON for a staged rename source and a quoted filename containing a newline, exit 1 for a forbidden commit restored later, and exit 2 for an invalid or non-ancestral base. The two orchestration guides use the same exit contract.
- The shard runner writes the receipt before verifying it and preserves the matrix index in the diagnostic. The aggregate retains checks for the planned inventory and revision, one receipt per planned shard, missing or duplicate identities, runner and test errors, and all tests passing. The shard helper retains its 0/1 CI contract, and the required gate entry points retain their 0/1/2 contracts. The landing guide starts with artifacts and requires all job pages and exact check names on the matched head, base, and tested merge.
- The matching installed and source story docs describe the pin, historical evidence, and integrated replay. Planner Pim assigns inventory and generated files to explicit owners and requires proof of gesture targeting and native capture where relevant. The integrated diff stays within triage 032. The package and Storybook changes for issue #87 came through main in PR #102. [Triage 032](../../../../triage/032-workflow-hardening.md)

## Evidence

- The merge `bc8fc6fb02a3e8421205a8a4e33394b53ec2da75` has the prior folded candidate and the recorded main as parents. Reconstructing the merge yields the same tree. The checked-in pin is the unique shared main revision. The replay snapshot has the historical phase base and that main SHA as parents. All five old and new commit pairs in the history map have identical trees. [History map](../history-map.txt)
- Phase 1 reports `approved` and `units.sh` returns `[]`. The initial and follow-up red commits contain only tests and remain in the reviewed ancestry. The replay at `c25d360d2b0780a06c1a6e95cffe2da80f4d8422` preserves 14 initial and two follow-up failing assertions. The final tests select the five phase proof files, fail on the integrated phase and fix bases, and pass at the recorded head. The changes after that head are replay evidence and the run summary timestamp. [Replay receipt](../phase-1/tdd-check.json)
- The independent focused run passed all 251 tests in the five changed suites. `git diff --check`, Story config copies, both changed wrapper and command copy comparisons, Sign-off, and Sandbox paths passed. The affected-Plant selector picked 326 of 326 Plants. It was run in list mode. The phase's earlier changed-source mutation record reports 168 mutants, zero survivors and zero timeouts. [Mutation record](../phase-1/mutation.md) · [Plant record](../phase-1/plants.md)
- The earlier folded candidate `b6519e174aece9300abb273e8c95172a4de0237b` had 19 successful required checks against main `25c53a915717fe464a67b53a7dd58ceaf4abc0c7`. The integrated review head still needs hosted checks on its final candidate. [Earlier hosted CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45740068184)
