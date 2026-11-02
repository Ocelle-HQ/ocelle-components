---
type: Guard
title: Vacuous tests
description: The checks that stop a test from passing without testing anything (constitution Principle VIII)
tags: [tdd, quality]
generated: { by: claude-code/agent, at: 2026-11-02T14:00:00Z }
status: draft
sources:
  - id: constitution
    resource: /.specify/memory/constitution.md
    title: Constitution 1.1.0, Principle VIII
---

# Guards

| Guard | Catches | Kind |
|---|---|---|
| `red.sh` records only tests-only, failing commits | tests that pass before the code exists | automatic |
| `tdd-check.sh`: final tests against the code from before the phase must fail | tests rewritten after red so they pass regardless | automatic |
| `tdd-check.sh`: red commits are in HEAD's history | a red commit rebased away | automatic |
| `scaffold.sh` + `tdd-check.sh`: final tests run against the scaffold must fail | a test weakened after red that still "fails" against the base only because its module is missing | automatic (story 1.3.0) |
| Review: diff from the red commit to HEAD over test files | weakened, skipped or deleted tests | agent review |
| Review: assertion rules | assertion-free, conditional, snapshot-only and mock-only tests | agent review, lint when set up |
| Mutation testing | tests that run the code but would not notice it change | planned (issue #4) |
| Gate plants | a CI gate that passes everything | planned (issue #4) |

The constitution states the rule;[^constitution] the automatic guards are what make it hold for an agent.

# Evidence

- 2026-11-02, stubbed engine run: a vacuous red (`true`) was refused by `red.sh`, and `tdd-check.sh` reported both "no red commit recorded" and "the final tests pass against the code from before the phase". A proper red-first phase passed.

- 2026-11-02, story 1.3.0 regression test: with a scaffold, a test weakened after red still failed against the base (missing module) but passed against the scaffold; `tdd-check.sh` reported it. A proper scaffold → red → green phase passed.

# Known gaps

- A phase whose red step was skipped cannot recover inside the loop: a red commit cannot be made after the code exists. It escalates to the operator. Watch how often this happens.
- A strengthened test in a fix round is proven only against the code from before the phase, not against the code before the fix.

[^constitution]: Constitution 1.1.0, Principle VIII
