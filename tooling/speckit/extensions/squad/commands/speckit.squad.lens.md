---
description: "One adversarial lens on spec and plan: write findings with evidence for the current squad round, change nothing"
---

# Squad Lens

You are one member of an adversarial review squad. Your job is to find what is **wrong** with the current
feature's spec and plan through one lens, with evidence, before any code is written. Other lenses run beside you
in separate sessions; do not try to cover their ground. **Change no file except your findings file, and do not
commit:** the refuter commits the round.

## User Input

```text
$ARGUMENTS
```

`lens=<name>`, one of `correctness`, `a11y-security`, `testability`, `fresh`. Any other value: stop with an error.

## Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` and read `FEATURE_DIR`. The current round
   is the highest `FEATURE_DIR/reviews/plan/round-<R>/`. Read `spec.md`, `plan.md`, `research.md`, `data-model.md`,
   `contracts/`, `quickstart.md` (those that exist), `.specify/memory/constitution.md`, and, in rounds after the
   first, the earlier rounds' `refute.md` and `verify-*.md` so you do not repeat settled findings.
2. Review through your lens. Verify claims against the repository and, where a claim is about a dependency,
   standard or browser behaviour, against its source; record what you checked. Do not report taste.
   - **correctness:** spec, plan, research, data model and contracts agree with each other and with the
     constitution; the plan meets every requirement and success criterion; the element interfaces meet the
     consumers' needs (kitty-mission-ui's recorded gaps, the console); semver impact is stated; nothing in the
     plan contradicts the repository as it is.
   - **a11y-security:** WCAG 2.2 AA in both themes and forced colours; no ID reference across a shadow root;
     the keyboard model of each ARIA pattern; focus management; target sizes; reduced motion; strict CSP (no
     inline script or style, no eval); no I/O and no network requests from elements; dependency and
     supply-chain risk.
   - **testability:** every requirement can be tested red-first by a test that can fail (Principle VIII); the
     planned tests assert observable behaviour; nothing in the plan invites vacuous tests (mocking the unit,
     snapshot-only, untestable visual claims); every new gate has a plant; mutation testing can reach the code.
   - **fresh:** no assigned lens. Assume the other lenses missed something and find it: a wrong assumption, a
     state nobody covered, a cheaper design, a requirement that will not survive contact with a consumer. In
     later rounds, attack the fixes of the round before.
3. Write `FEATURE_DIR/reviews/plan/round-<R>/lens-<name>.yaml`:

   ```yaml
   schema: review-findings/v1
   complete: true
   phase: plan
   round: <R>
   lens: <name>
   findings:
     - id: PLAN-<LENS>-<R>-<NNN>        # LENS in capitals: CORRECTNESS, A11Y-SECURITY, TESTABILITY, FRESH
       severity: 1-4                     # 4 = builds the wrong thing or an unsafe thing; 1 = minor
       title: "<one line>"
       evidence:
         - artifact: "<file § section and the words that are wrong>"
         - code: "<path:line in the repository, or a probe you ran and its result>"
       claim: |
         <what is wrong and why it matters>
       remedies:                         # one entry = a fix; two or more = a fork for the operator
         - "<a concrete change to spec, plan or design artifacts>"
   ```

   An empty `findings: []` is a valid result. Set `complete: true` only when you finished the whole lens.

## Report

The number of findings per severity and the file path.
