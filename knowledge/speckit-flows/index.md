---
okf_version: "0.2"
---

# Spec Kit flows of ocelle-components

* [Diary](log.md) - What changed in the flows, when and why; newest first

# Flows

* [ocelle-triage](flows/ocelle-triage.md) - Start here: triage issues into a mission, an op, a fold or no work
* [triage-tara](flows/triage-tara.md) - The agent profile that triages
* [triage extension](flows/triage-extension.md) - Commands and scripts for triage and ops
* [ocelle-sdd](flows/ocelle-sdd.md) - specify, spec check, plan, plan squad, tasks and analyze with operator gates, then implementation by user story
* [ocelle-implement](flows/ocelle-implement.md) - Runs the per-phase loop for every tasks.md phase that still needs work
* [ocelle-story](flows/ocelle-story.md) - One phase: red, green, then batches of checked review and fix rounds
* [story extension](flows/story-extension.md) - The Spec Kit extension behind the loop: commands, scripts and configuration
* [ocelle-spec-check](flows/ocelle-spec-check.md) - Spec-only check after specify, with a fix loop and an operator gate
* [ocelle-plan-squad](flows/ocelle-plan-squad.md) - Adversarial review of spec and plan after the plan phase
* [squad extension](flows/squad-extension.md) - Commands and scripts for the spec check and the plan squad

# Guards

* [Vacuous tests](guards/vacuous-tests.md) - The checks that stop a test from passing without testing anything
* [Review escalation](guards/review-escalation.md) - What happens when a phase is not approved after a batch of rounds
* [Adversarial plan squad](guards/adversarial-squad.md) - Stops a wrong or untestable plan before tasks are generated

# Experiments

* [Spec Kit as the process for this repository](experiments/2026-11-02-spec-kit-baseline.md) - Can Spec Kit plus the story loop match Spec Kitty's implement-review discipline

# Findings

* [Headless agent steps need permissions](findings/headless-permissions.md) - claude -p cannot answer permission prompts; resolved with a committed allowlist
* [The analysis was not saved](findings/analysis-not-saved.md) - /speckit-analyze only printed its report; it is now saved as analysis-report.md
* [Review evidence was left uncommitted](findings/review-evidence-uncommitted.md) - The review committed its verdict but not the check results it relied on

# Runs

* [Run summaries](runs/) - One summary per feature, generated from its review files by the story summary script
