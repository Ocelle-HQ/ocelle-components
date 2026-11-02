---
okf_version: "0.2"
---

# Spec Kit flows of ocelle-components

* [Diary](log.md) - What changed in the flows, when and why; newest first

# Flows

* [ocelle-sdd](flows/ocelle-sdd.md) - specify, plan, tasks and analyze with operator gates, then implementation by user story
* [ocelle-implement](flows/ocelle-implement.md) - Runs the per-phase loop for every tasks.md phase that still needs work
* [ocelle-story](flows/ocelle-story.md) - One phase: red, green, then batches of checked review and fix rounds
* [story extension](flows/story-extension.md) - The Spec Kit extension behind the loop: commands, scripts and configuration

# Guards

* [Vacuous tests](guards/vacuous-tests.md) - The checks that stop a test from passing without testing anything
* [Review escalation](guards/review-escalation.md) - What happens when a phase is not approved after a batch of rounds

# Experiments

* [Spec Kit as the process for this repository](experiments/2026-11-02-spec-kit-baseline.md) - Can Spec Kit plus the story loop match Spec Kitty's implement-review discipline

# Findings

* [Headless agent steps need permissions](findings/headless-permissions.md) - claude -p cannot answer permission prompts; resolved with a committed allowlist
* [Review evidence was left uncommitted](findings/review-evidence-uncommitted.md) - The review committed its verdict but not the check results it relied on

# Runs

* [Run summaries](runs/) - One summary per feature, generated from its review files by the story summary script
