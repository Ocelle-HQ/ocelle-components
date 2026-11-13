---
check: 2
verdict: clean
---

# Spec check 2

Read: `spec.md`, `checklists/requirements.md`, `reviews/spec/check-1.md`, `reviews/spec/check-1-fixes.md`,
constitution (principles II, III, IV, V, VIII and the Development Workflow), and for the facts the spec states,
`gates/README.md` (gate CLI contract, gates table, required checks), `package.json` (Playwright 1.64.1),
`storybook/package.json` (Storybook 10.6.5), `storybook/stories/*.ts` (8 token and 4 base-style stories, no
non-ASCII text) and `packages/tokens/fonts/` (one upright variable face, `SchibstedGrotesk-wght.woff2`).

Earlier checks: every blocking finding of check 1 (SPEC-1-01 to SPEC-1-05, SPEC-1-07, SPEC-1-08) is resolved where
its fix note says; SPEC-1-06 is answered by the operator and recorded in the header, FR-006, FR-007, FR-009,
Assumptions and Key Entities; the notes SPEC-1-09 to SPEC-1-17 are resolved as their fix notes say. No
`[NEEDS CLARIFICATION]` marker remains. Every user story has a priority, an independent test and Given/When/Then
scenarios with observable outcomes (exit codes, finding lines, files written). No requirement conflicts with a
constitution principle: the Storybook leaves the CSP scope by operator decision Q1, Schibsted Grotesk is the only
allowed face (FR-027), forced colours stays with element tests (constitution III, 002 FR-018 note).

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | note | spec.md FR-026, FR-004, US2 scenario 2, SC-003 | "Before and independently of the baseline comparison" leaves open what happens to the baseline comparison when the two captures of a story-theme differ: whether it still runs (and with which of the two captures), so a nondeterministic story may give one finding (`nondeterministic`) or two. SC-003 requires each plant's exact findings, so the plan must fix the count. | Say whether a story-theme with a `nondeterministic` finding is also compared with its baseline, and if so which capture is compared. |
| SPEC-2-02 | note | spec.md FR-013, US3 scenario 3; gates/README.md "How a gate runs" | Moderate and minor axe results "printed as notes" on exit 0 go beyond the gate CLI contract, which gives exit 0 one summary line and exit 1 finding lines plus a summary. The note line format is not defined, and nothing says how the plant job tells a note from a finding. | Let the plan extend the contract with a note line (format, and that the plant job ignores notes when it counts findings), or print notes only as a count in the summary. |
| SPEC-2-03 | note | spec.md FR-013, FR-016, US3 scenario 2 | axe also returns `incomplete` results (needs review), for example `color-contrast` on text over a background it cannot resolve, with serious impact. The spec does not say whether those fail, are notes or are ignored. If ignored, a contrast failure axe cannot resolve passes without trace, which weakens the gate Principle VIII asks for. | State how serious and critical `incomplete` results are treated (a finding, or a note naming the node). |
| SPEC-2-04 | note | spec.md FR-029, FR-016 | "The gate honours only exceptions so recorded" needs the gate to read exceptions from somewhere, but the spec does not say how a Complexity Tracking row (a markdown table) reaches the gate. No plant shows that an unrecorded exception is not honoured. The case matters only if the first `axe` run finds something that needs a 002 or 003 change. | If an exception is ever recorded, the plan names the machine-readable source the gate reads and adds a fail plant (an exception without a Complexity Tracking row) and a pass plant (a recorded one). |
| SPEC-2-05 | note | spec.md US1 "Why this priority", FR-009, FR-017 (`axe` breaking plant "a build that fails"; no `visual` counterpart) | The spec does not say where the `visual` and `axe` gates get the built Storybook: they build it themselves, or they read a build made by another job. The `axe` gate has a breaking plant for a build that fails and the `visual` gate has none. For `visual` it is also open whether the build runs on the host or inside the linux/amd64 container. Inside the container, an arm64 host's mounted `node_modules` holds native binaries for the host platform, not for linux/amd64. | The plan states where each gate gets its build, what `visual` exits on a failed build (presumably 2), and that the container's build inputs are platform-correct on arm64 hosts. |
| SPEC-2-06 | note | spec.md FR-008, Edge Cases (podman rootless) | "Without root" can be tested for rootless podman. Under docker, access to the daemon is root-equivalent, and files the container writes into the mounted repository are owned by root on the host unless the command maps the user. The spec does not say what "without root" means for docker, or who owns the written baselines. | State that the baseline files written under either engine are owned by the invoking user, and what "without root" requires of docker (for example a user in the `docker` group, no `sudo`). |
| SPEC-2-07 | note | spec.md FR-007 ("MUST make no network access during a capture") | No test, plant or gate finding is named that would fail if a capture made a network request. The Storybook no-network evidence (FR-002, FR-021) covers the build and the run-time test, not the container capture. | Either enforce it so that it cannot happen (the host entry point starts the container with networking disabled, checked by a test of the entry point's arguments), or name the check that observes it. |
| SPEC-2-08 | note | spec.md FR-007, FR-009, Assumptions | The spec does not say whether the pinned image is a third-party published image pinned by its linux/amd64 digest, or an image this repository builds and publishes. Building and publishing one would need a registry and repository settings, which only the operator can provide and which no scope line covers. | The plan states which. If the repository must publish an image, raise it to the operator before tasks. |

No blocking or operator findings.
