# Operator decision: triage 030, Q1–Q6 (2026-11-25)

Answers to the questions in `triage/030-release-v1.md`:

- **Q1 (constitution says "goes public with 1.0.0" and "publish token lives only in CI secrets"): (a)** amend the
  constitution in this mission (PATCH-level clarification).
- **Q2 (publish credential): (a)** npm trusted publishing via GitHub Actions OIDC; no long-lived token, provenance
  automatic. The plan settles the first-publish bootstrap (any bootstrap token is operator-held and revoked at O8).
- **Q3 (versions): (a)** lockstep `1.0.0`, peer `@ocelle/tokens` at `^1.0.0`.
- **Q4 (wait for #73, #75, #76, #59): (a)** no; they ship as 1.x.
- **Q5 (trigger): (a)** the operator pushes a protected `v1.0.0` tag; the publish job waits for the environment
  reviewer.
- **Q6 (release tooling): (a)** no new release tool; changelogs stay hand-written.

Also standing for this mission (operator orchestration, 2026-11-25):

- O1 (npm org `ocelle` claimed) is done.
- The publish job runs in a protected GitHub environment with a required reviewer; release tags are protected by a
  ruleset. Both are operator-only settings steps.
- Points raised at the gate for the spec: #11 also asks that "the history contains no secrets" (a history secret
  check), and #1's gap table files upstream #498 under #13 (data display), not #7.
- Design now, build after #7 (mission 018) lands.

Source: the operator (jeroennouwsdev), answered at the triage gate of the /ocelle-run session for #11.
