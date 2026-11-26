---
op: 032
triage: triage/032-workflow-hardening.md
issues: [96, 97]
mode_of_work: task_execution
accountable: "human:MOES-Media"
semver: none
status: started
---

# Op 032 — Harden phase replay and review handoffs

## Intent

Keep focused verification useful after a main merge, shorten hosted failure diagnosis, and catch role and Storybook planning mistakes before integration.

## Acceptance

1. On a fixture where main adds a test and both branches edit another test, final replay excludes the main-only test, retains the phase's assertion in the shared test, and proves red and green. The original base and red records retain their identities. An invalid main pin or replay conflict fails verification.
2. Given mismatched shard inventories and a runner failure, the failed result names missing and unexpected project/file pairs and includes the runner error. Landing begins with the current candidate's artifacts and checks all exact required names from its tested registry and Plants across all job pages.
3. An allowed role change exits 0. A forbidden change exits 1 with the offending paths in JSON, including both sides of a rename where either side is out of scope. An uninspectable Git state fails with exit 2.
4. In a Storybook phase plan, every generated result has one owner. The preflight covers the story index, light and dark baselines, repository and negative Axe counts and affected Plants. A no-action gesture check establishes its target and native capture when required before asserting silence.

## Constitution principles touched

Principles V and VIII govern Storybook evidence and test-first workflow changes. Exact shard and replay verification, signed commits, independent review and the full CI requirements apply.
