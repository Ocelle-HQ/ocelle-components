---
triage: 036
issues: [86]
decision: mission
target: "specs/036-anchored-popover"
in_scope: [86]
out_of_scope: [7, 16, 76, 87, 88, 89, 90, 91, 92]
semver: minor
spec_prompt: "Specify issue #86 and triage/036-anchored-popover.md as an independent MINOR mission for a reusable nonmodal anchored popover in @ocelle/elements. Cover named icon and initials triggers, native control semantics and Tab order, exposed open state, Escape focus return, outside-pointer dismissal without taking focus, host-directed close, top and bottom placement that escapes clipping and stays within the viewport, and fictional appearance and profile Storybook examples. Prove the behavior with focused browser and built strict-CSP tests, keyboard and accessibility coverage, 320 px and 200% text checks, forced colours, and pinned light and dark baselines. Use the verified Op 034 procedure for a separate second pilot and retain all required controls."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-26T21:32:28Z
---

# Triage 036 — Anchored popover for compact controls

## Issues read

On 2026-11-26 UTC, the triage checkout was pinned to `823de462a542d3545749ebb963cf8ffc18391541`.
Issue #86 was open with no comments, labels, milestone, or listed blockers. GitHub lists #92 as its parent. The
issue timeline contained the parent link and no pull request references. The open pull request list and searches
for the popover terms and issue reference found no competing implementation. [Checkout pin](https://github.com/Ocelle-HQ/ocelle-components/commit/823de462a542d3545749ebb963cf8ffc18391541) · [Issue #86](https://github.com/Ocelle-HQ/ocelle-components/issues/86) · [Blockers](https://api.github.com/repos/Ocelle-HQ/ocelle-components/issues/86/dependencies/blocked_by) · [Issue timeline](https://api.github.com/repos/Ocelle-HQ/ocelle-components/issues/86/timeline) · [Open pull requests](https://github.com/Ocelle-HQ/ocelle-components/pulls)

The epic assigns shared components and Storybook verification to this repository. It points to #76 for the
Studio composition order. #76's authoring phase names #72, #73 and the status presentation from #7. Its
run-inspection phase names #74 and timeline work in #13, and catalog upgrades consume #75. Those dependencies
govern the Studio composition. The acceptance in #86 can be demonstrated with the current button and icon
primitives and fictional host state in isolated placements. [Epic #92](https://github.com/Ocelle-HQ/ocelle-components/issues/92) · [Studio composition #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) · [Merged button and action-row PR #50](https://github.com/Ocelle-HQ/ocelle-components/pull/50)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #86 | Open epic child | In scope | Adds the reusable anchored surface and its small appearance and profile examples. [Issue #86](https://github.com/Ocelle-HQ/ocelle-components/issues/86) |
| #16 and PR #47 | Shipped overlay mission | Precedent | The tooltip uses the browser top layer for a descriptive bubble and already verifies placement against viewport edges. The dialog and drawer supply modal focus and stacking precedents. The anchored interactive surface has its own focus and dismissal contract. [Overlay issue](https://github.com/Ocelle-HQ/ocelle-components/issues/16) · [Merged overlays](https://github.com/Ocelle-HQ/ocelle-components/pull/47) |
| #7 and PRs #50 and #105 | Actions and status work | Out of scope | The merged #50 already supplies the button, its native semantics and expanded-state conventions. Open #105 is the remaining pill tag, status indicator and metric delivery for #7. It may affect shared export, manifest or Storybook inventories at integration, with no popover behavior dependency. [Issue #7](https://github.com/Ocelle-HQ/ocelle-components/issues/7) · [Merged PR #50](https://github.com/Ocelle-HQ/ocelle-components/pull/50) · [Open PR #105](https://github.com/Ocelle-HQ/ocelle-components/pull/105) |
| #91 and PRs #83–#85 | Chrome treatments and layout | Out of scope | #91 owns the reusable initials treatment and any missing chrome glyphs. A named initials button with fictional text suffices for this popover's fixture. The open chrome stack changes the top-bar divider, rail divider and shell accessory placement. Use isolated examples and leave those products to their existing work. [Issue #91](https://github.com/Ocelle-HQ/ocelle-components/issues/91) · [PR #83](https://github.com/Ocelle-HQ/ocelle-components/pull/83) · [PR #84](https://github.com/Ocelle-HQ/ocelle-components/pull/84) · [PR #85](https://github.com/Ocelle-HQ/ocelle-components/pull/85) |
| #88 and #90 | Open siblings | Out of scope | The split-pane settings recipe and single-link action row each have independent acceptance. [Settings #88](https://github.com/Ocelle-HQ/ocelle-components/issues/88) · [Action row #90](https://github.com/Ocelle-HQ/ocelle-components/issues/90) |
| #87 | Shipped first preflight regression | Verification precedent | The step-indicator mission showed why generated manifest overlays and a shared Storybook host's active mutation project need early checks. [Issue #87](https://github.com/Ocelle-HQ/ocelle-components/issues/87) · [Step-indicator triage](033-pane-step-indicator.md) |
| #89 and PR #104 | First live pilot | Sequencing and evidence only | Both product phases received independent review and the matched live control runs succeeded. PR #104 was still open at this assessment. The Copy field is independent of the popover. [Pilot PR #104](https://github.com/Ocelle-HQ/ocelle-components/pull/104) · [Earlier control](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45854965102) · [Review-only control](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45855165488) |
| #92, #76, and PRs #103 and #106 | Epic, Studio composition, and pilot tooling | Context and sequencing | MOES-Media approved Op 034's order on 2026-11-26, with #89 first and #86 second when ready. The exact #106 correction head is this triage's code pin and its required CI was successful. The separate product triage is proposed. [Approved Op 034 triage](034-workflow-pilots.md) · [Epic #92](https://github.com/Ocelle-HQ/ocelle-components/issues/92) · [Studio #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) · [Op PR #103](https://github.com/Ocelle-HQ/ocelle-components/pull/103) · [Observer correction PR #106](https://github.com/Ocelle-HQ/ocelle-components/pull/106) · [Correction CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45858408090) |

## Decision

Propose one **MINOR mission** for #86 as the next independent pilot. The reusable trigger, surface and host-close
contract adds public package surface. Its focus, dismissal, placement and accessibility requirements warrant the
full mission workflow. Existing primitives make the smallest deliverable independently testable. The approved
Op 034 sequencing authorizes the experiment order. The product triage and the subsequent mission decisions follow
the normal operator gates. [Approved Op 034 triage](034-workflow-pilots.md) · [Constitution](../.specify/memory/constitution.md)

## Scope

- Implement the reusable surface first. A meaningfully named icon-only or initials trigger opens with click,
  Enter or Space and exposes the state on its actual control. Preserve the native controls and their Tab order.
  Escape returns focus to the trigger. An outside click leaves focus with the clicked target, and the host can
  request closure after selection. Check trigger and surface behavior at both viewport edges and inside a clipping
  ancestor. Verify below-trigger top placement and above-or-beside bottom placement at 320 px. [Issue #86](https://github.com/Ocelle-HQ/ocelle-components/issues/86)
- Follow with two executable Storybook examples. One shows an appearance picker that exposes which Light or Dark
  choice is pressed. The other shows a profile action group with a host-supplied Sign out action. All identities
  and state are fictional. Theme persistence, profile data and sign-out effects belong to the host. The examples
  exercise the top and bottom placements without changing the existing chrome components. [Issue #86](https://github.com/Ocelle-HQ/ocelle-components/issues/86)
- Plan a focused source/browser red and historical replay for the exact scoped test files and built strict-CSP
  verification from the packaged entry. Verify root and individual exports, generated manifest, documented public
  options and a MINOR changelog. Prove actual focus, native semantics and checked or pressed state in the browser
  and accessibility tree. Test 320 px and 200% text independently where applicable, keyboard navigation, light
  and dark visual baselines from the pinned environment, forced colours, and the applicable accessibility and
  affected Plants checks. [Contribution workflow](../CONTRIBUTING.md) · [Constitution](../.specify/memory/constitution.md)

## Separate pilot verification

The first pilot found a hosted Visual job-log retrieval failure. Verified offline replay also exposed how the
historical attempt had been checked against the live PR association. At the corrected collector pin, replay
verified the candidates and their Visual inputs and declared reuse ineligible because the measured pnpm launcher
hashes differed. The full required control runs supplied the results. Review the first-pilot retrospective
before activating the second trial, and record the exact verified observer revision being used. [First pilot PR](https://github.com/Ocelle-HQ/ocelle-components/pull/104) · [Hosted observation](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45861599281) · [Observation artifact](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45861599281/artifacts/15137179453) · [Observer correction](https://github.com/Ocelle-HQ/ocelle-components/pull/106)

- During planning, use manifest preflight against the recorded phase base to assign every active generated
  manifest overlay and its exact expected findings. If an executable shared Storybook host changes, record how
  its focused tests are discovered under both normal and default mutation configurations and verify the actual
  scoped host result before capture. Keep the built browser and CSP proof alongside the in-process tests. [Op 034 procedure](https://github.com/Ocelle-HQ/ocelle-components/blob/823de462a542d3545749ebb963cf8ffc18391541/tooling/speckit/README.md#verification-pilots)
- Inspect the actual standard Mutation plan for #86. Compare default and elements configurations on a live
  #86 candidate only if the same selected shard genuinely contains both, with an exact head, diff base, unchanged
  selectors and matched coverage, mutant and verdict receipts. The existing pinned #87 comparison is historical
  evidence. If no live mixed shard applies, record why and use the standard Mutation result for #86. [Op 034 plan](../ops/034-workflow-pilots/plan.md)
- When an evidence-only revision exists, collect an exact same-PR pair with successful required runs on both
  candidates. Record head, common base, tested merge, run and attempt, audited inputs and runtime identities,
  plus fresh Sign-off and Sandbox paths results. Treat a changed or unverified input as ineligible. At the
  retrospective record first actionable failure, verified green, actual runner minutes and slowest job, failures
  and retries, coverage and verdict parity, preflight misses and rework. Count potential reuse separately from
  executed CI, and verify any adjustment before another pilot. [Approved Op 034 triage](034-workflow-pilots.md)

## Risks and open questions

- The current package floor is Chromium 135 and WebKit 17.4. Resolve placement and scroll or resize behavior
  against that floor during design. The existing tooltip demonstrates the top layer. Any proposed positioning
  mechanism still needs proof on the supported engines or a compatible path. The fixed CSP also applies to
  positioning and to executable examples. [Package engines](https://github.com/Ocelle-HQ/ocelle-components/blob/823de462a542d3545749ebb963cf8ffc18391541/packages/elements/README.md#engines) · [Overlay implementation precedent](https://github.com/Ocelle-HQ/ocelle-components/pull/47)
- Settle the trigger attachment, state ownership and host-close contract in the spec. Test real shadow-root and
  focus boundaries, including which surface handles Escape when overlays coexist and where focus lands when
  an outside target is clicked. The exact API choices belong to mission design. [Accessibility constitution](../.specify/memory/constitution.md#iii-accessible-by-construction-non-negotiable)

## What would change this decision

Reopen the scope if a competing #86 implementation appears, a required trigger or layout dependency is established,
or the agreed interaction cannot be supported at the current engine floor. If the first checkpoint has unverified
tooling changes, retain normal product verification and defer the affected experiment until the adjustment is verified.
