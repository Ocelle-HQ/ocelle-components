# Implementation Plan: Verification improvements and workflow pilots

## Workstreams

### A. Separate mutation configurations

Identify one historical shard containing both configurations from #87 and recover its standard entries on the exact folded review source. Pin its source head, diff base, tree, standard selectors and runtime. Add a separate opt-in comparison using existing `--shadow-grouped` receipts. Invoke the same unmodified standard selectors in the mixed control and in the two configuration subsets. Do not combine entries or remove or extend lines. Verify that comparing configuration isolation does not activate a changed grouping plan.

Match both arms on exact changed-line coverage, selector ownership, nonempty inventory where expected, the union of mutant identities and outcomes, and the standard verdict. Reject incomplete, duplicate, stale or mismatched receipts. Record baseline test counts, setup and execution time per configuration, slowest job, runner minutes and retries. Use a seeded surviving mutant to prove failure parity independently of successful timing. Trial the arrangement on a genuinely mixed #86 head when applicable.

### B. Observe possible reuse of hosted CI evidence

Add a separate observational check and receipt for the current PR candidate, starting with Visual regression. Keep both required CI executions. Fetch the prior successful completed run and matching attempt from the same repository and PR for `.github/workflows/ci.yml`. Obtain every page of required jobs and reject missing, duplicate, non-green or unknown results. Verify current and prior head, common unchanged base, the two tested merge SHAs and their parents, and compare their trees. Require that all tree changes are in a narrow set of known review evidence files under an op or feature's phase and landing review directories. Reject changes to any gate input, including source, tests, manifest fixtures, inventories, config, workflows, dependencies or an evidence file read by the gate.

Audit Visual regression's effective inputs and runtime on both exact candidates. From the trusted Visual job attempt, use the existing `pin-record` artifact and GitHub-generated job setup metadata for the pinned container, runner image and architecture. Require immutable engine and tool identity from that job's trusted runtime evidence as well. The pilot must demonstrate a real evidence-only pair with both complete identities and equal audited inputs. Record which trusted evidence supplied each identity. Treat absent, unreadable or different provenance as ineligible. Run fresh Sign-off and Sandbox paths checks on the current exact candidate or verify their fresh required results from its matched run. Record eligibility and why, source and current run attempts, verified input/runtime identities, and the observed comparison against actual current CI. The result grants no merge authority.

### C. Preflight manifest fixtures and Storybook mutation routing

Provide a contributor entry point that runs the manifest overlay checks and, for a declared shared host, default mutation discovery. Extend Planner Pim's existing Storybook preflight with exact paths and one owner for canonical manifest generation and all applicable overlays. Discover active full overlays from the actual manifest Plant descriptors and their fixture trees. The current inventory has eight valid full overlays. Reuse exact raw finding coverage, keep the reordered pass case clean, and prove the stale/extra-finding case fails with an actionable fixture path. Keep the Plant descriptors authoritative for intended findings and verify that a new affected overlay enters the inventory.

For a shared Storybook host, record the source, default Stryker configuration, focused tests and retained in-process Vitest project. Check actual default mutation discovery and exact project ownership. Use the #87 pane footer positive example and an excluded built-browser-only negative probe. Attach a scoped Stryker result on the changed host whenever applicable. Discovery routes a test but does not establish that the host's mutants are covered. Keep built-browser, Visual, Axe, CSP and Plants evidence.

## Integration and ticket checkpoints

Join the three disjoint one-phase lanes after their returns pass scope and dependency checks. Record matched source and runtime pins, reference and experimental verdicts, seeded failures and final full required CI on the exact candidate. Reuse the repository retrospective after #89 and #86 to record time to first failure and final verified green, total compute, failed runs/retries, coverage and verdict parity, and avoidable rework. Update the workflow and reverify the change, or record why the current workflow should remain. Check the next ticket's dependencies and overlap after each checkpoint.

## Constitution Check

**Pass.** The op adds no package API or branch-protection change. The required Mutation and CI jobs, tested coverage, normal evidence and independent review remain mandatory. The pilots keep their own product triage and checks.
