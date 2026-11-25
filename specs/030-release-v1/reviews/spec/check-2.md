---
check: 2
verdict: clean
---

# Spec check 2

Inputs read: `spec.md`, `checklists/requirements.md`, `sources/issue-11.md`, `sources/issue-1-gap-table.md`,
`triage/030-release-v1.md`, `.specify/memory/constitution.md` (1.3.1), `reviews/spec/check-1.md`,
`reviews/spec/check-1-fixes.md`, and the three `packages/*/package.json` on this branch.

## Earlier checks

| Check 1 finding | Fix note says | Status in spec.md |
|---|---|---|
| SPEC-1-01 (blocking) | fixed | Resolved. Story 2 Independent Test (line 103-107) and Scenario 2 (line 113-115) name the `#498`, `#509` and `#524 #526` rows, matching FR-010 and the gap table. SC-004's "17 of 17" matches the 17 rows of `sources/issue-1-gap-table.md`. |
| SPEC-1-02 (blocking) | fixed | Resolved. Story 4 narrative, Scenario 1 (line 186-188) and SC-001 install all three packages, as FR-030 does. |
| SPEC-1-03 (blocking) | fixed | Resolved for the attestation part: FR-034, FR-033's note, Story 4 Independent Test and SC-008. See SPEC-2-01 for the signature part. |
| SPEC-1-04 (operator) | answered (b) | Resolved. Operator decisions list (line 43-46), FR-020, FR-026, FR-027, Story 3 Independent Test and Scenario 7, fork edge case, Key Entities, SC-009. |

Notes SPEC-1-05 to SPEC-1-13 are not covered in the fix note. They still apply as written in check 1 and are not
repeated here.

## Findings

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | note | spec.md FR-031 (line 344-345), FR-034 (line 352-357), SC-008 (line 437-439) | FR-031 verifies both the registry signature and the provenance attestation. FR-034's planted failures (no attestation, another repository, another commit) are all attestation failures. Nothing shows the signature part failing, so under constitution VIII ("Gates are proven, too") it can still pass vacuously. A failing real-registry input may not exist, because every version on the public registry is signed. | Add a planted signature failure (for example a tarball whose integrity or signature does not match, served locally) to FR-034 and SC-008. If no such plant is possible, have the spec say that the signature part depends on the registry tool alone and is not a proven gate. |
| SPEC-2-02 | note | spec.md FR-034 pass case (line 353-354) vs FR-031 | Before the first release, no version from this repository is on the registry. So the pass case must be another project's package, and its attestation names another repository and commit. That passes only if the verifier takes the expected repository and commit as inputs. The spec does not say so, and the "another repository" plant only makes sense against a given expected value. | State in FR-031 or FR-034 that the verification takes the expected repository and commit as parameters, and that the pass case and the plants set them. |
| SPEC-2-03 | note | spec.md FR-027 (line 330-336), FR-014 (line 296-297), SC-009 (line 440-442) | The outcome of a dry-run run is not defined. FR-014 makes a not-ready readiness check exit non-zero, and FR-022 says any failure stops the workflow. FR-027 says the dry run "still shows every other step" and "report[s] the result". The spec does not say whether a not-ready verdict makes the dry-run run fail (a red pull-request check) or is only reported, or whether the dry run is a required check. O6 lists only FR-006 and FR-026. | Say whether the dry run fails on a not-ready verdict or a failed step, that later steps still run after a readiness failure, and whether it is a required check. |
| SPEC-2-04 | note | spec.md FR-022 (line 313), FR-027 (line 332), Story 3 narrative (line 129) | "The readiness check on exactly those tarballs" does not match FR-010 to FR-013, which define the readiness check on a commit (gap rows, history, manifests, changelogs). Only the version check can read a tarball. | Reword as "the readiness check on the commit the tarballs were built from", or name which readiness parts read the tarballs. |
| SPEC-2-05 | note | spec.md FR-013 (line 293-295), FR-005, Edge case "Wrong tarball published" (line 230-231) | The workflow is generic over `v*` tags, and the spec names `1.0.1` as the fix for a wrong tarball. But FR-013 checks for a dated `1.0.0` changelog entry by name. A `1.0.1` release would pass this check with no `1.0.1` entry. | Have FR-013 check for the entry of the version being released (the shared version of FR-012), with `1.0.0` as this release's case. |
| SPEC-2-06 | note | spec.md Story 2 Independent Test (line 106-107) | The "ready" fixture is described only as "every row is met and the history is clean". A ready verdict also needs one shared version (FR-012) and dated changelog entries (FR-013), so a fixture built from this text alone reports not-ready. | Add "packages at one version with dated changelog entries" to the ready fixture. |

Counts: blocking 0, operator 0, note 6.

Element-state edge cases (loading, empty, error, disabled, long text, narrow width, forced colours, themes) do not
apply: this feature adds no element. No constitution conflict found for I/O in elements, raw style values, `sk-`
names, monospace, inline script or style, or network requests from elements. The constitution text FR-040 and FR-041
amend is quoted correctly. `SECURITY.md` has existed since mission 001, so FR-041's "past fact" reading is true.
