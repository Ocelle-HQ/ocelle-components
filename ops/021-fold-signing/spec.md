# Op Specification: The history fold signs the commits it rebuilds

**Op**: `ops/021-fold-signing` | **Issue**: #51 | **Triage**: `triage/021-fold-signing.md`
**Created**: 2026-11-16 | **Status**: started

## Intent

`/ocelle-run` folds each approved phase with `tooling/speckit/bin/fold-history.sh`, and `/ocelle-land` folds the
landing commits. The fold rebuilds commits with `git commit-tree`, which never signs, so every folded commit loses
its signature. This op makes the fold sign what it rebuilds, refuse a result that is not signed, and refuse to
rewrite commits that are already on main. Branches already folded stay as they are.

## User Scenarios & Testing

### User Story 1 - A folded branch is signed end to end (Priority: P1)

An implementer with `commit.gpgsign` on runs the fold after a phase. Every commit the fold creates is signed with
their configured key. If the fold cannot produce a signed history, or the range holds commits from main, the branch
is left exactly as it was and the JSON output says why.

**Why this priority**: it is the op's only story.

**Independent Test**: `gates/test/integration/fold-history.test.ts`, on temporary git repositories with a
throwaway signing program.

**Acceptance Scenarios**:

1. **Given** signing on and a branch whose fold rewrites at least one commit, **When** the fold runs, **Then** it
   exits 0 and every commit of `<base>..HEAD`, the remap commit included, has a `gpgsig` header.
2. **Given** signing on and a `commit-tree` that produces an unsigned commit, **When** the fold runs, **Then** it
   exits 1 with `ok:false` and a problem naming the unsigned commit; `HEAD`, the evidence files and the refs are
   unchanged and no prefold ref exists.
3. **Given** signing on and a signer that fails, **When** the fold runs, **Then** it exits 2 with `ok:false` JSON;
   `HEAD` and the evidence files are unchanged and no prefold ref exists.
4. **Given** signing on and a signer that fails only for the remap commit, **When** the fold runs, **Then** it
   exits 1 with `ok:false`; `HEAD` is the old head and no prefold ref exists.
5. **Given** a `main` (or `origin/main`) ref that reaches a commit of `<base>..HEAD`, **When** the fold runs,
   **Then** it exits 2 with `ok:false` and a problem naming main, and changes nothing.
6. **Given** `commit.gpgsign` off, **When** the fold runs, **Then** it behaves as today (unsigned, no signature
   check).

### Edge Cases

- `commit.gpgsign` unset counts as off.
- Neither `refs/remotes/origin/main` nor `refs/heads/main` exists: no main guard. The fold does not fetch.
- A stale local `main` can only reach fewer commits than the real main, so the guard can miss but never refuses
  wrongly.
- A commit signed with SHA-256 objects carries `gpgsig-sha256`; it counts as signed.
- A folded commit is signed by the folder's key while its author and committer are copied from the original. This
  is the operator's choice and matches the remap commit.

## Requirements

### Functional Requirements

- **FR-001**: When `git config --bool commit.gpgsign` is `true`, every `git commit-tree` call that builds a folded
  commit passes `-S`, so it uses the configured `gpg.format` and `user.signingkey`.
- **FR-002**: When signing is on, before the branch moves, every new commit in the fold's map must have a `gpgsig`
  or `gpgsig-sha256` header; a missing one is a problem (`folded commit <sha> is not signed`), exit 1, as the
  existing tree checks do.
- **FR-003**: A failing `git commit-tree` (for example, signing fails) ends the fold with exit 2 and the `die` JSON,
  before any ref or the working tree changes.
- **FR-004**: When signing is on and the remap commit fails or has no signature header, the fold resets to the old
  head, deletes the prefold ref it created, prints `ok:false` with the problem, and exits 1.
- **FR-005**: Before building any commit, if a commit of `<base>..HEAD` is reachable from `refs/remotes/origin/main`
  or `refs/heads/main` (each that exists), the fold exits 2 through `die` and changes nothing.
- **FR-006**: With signing off, behaviour, output and exit codes are those of today.
- **FR-007**: `tooling/speckit/README.md` and the script's header comment say that the fold signs what it rebuilds
  and refuses main's commits.

### Out of scope

- Re-signing branches already folded (`claude/016-overlays`, `claude/008-layout-headers` and the others).
- The mission 011 and 008 re-sign scripts, the skills, `gate:signoff`, the commit guard, CI rulesets and any CI
  signature check.
- The fold's interface, evidence remapping and the existing outside-evidence failure path.

## Success Criteria

- **SC-001**: A fold run with signing on leaves no unsigned commit in `<base>..HEAD`.
- **SC-002**: No failure path of the fold with signing on leaves `HEAD` moved or a prefold ref behind (scenarios 2
  to 5).

## Assumptions

- Git 2.34 or newer (SSH signing; this environment has 2.43).
- The fold runs where `commit.gpgsign` and a working signer are configured, as in this environment.
