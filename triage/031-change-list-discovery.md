---
triage: 031
issues: [75]
decision: mission
target: "031-change-list-discovery"
in_scope: [75]
out_of_scope: [7, 13, 14, 15, 72, 73, 74, 76, 93]
semver: none
spec_prompt: "Resolve #75 and triage/031-change-list-discovery.md with two runnable Storybook composition fixtures and an evidence-based recommendation. Show retention changing from 24 hours to one hour alongside an unchanged field, and compare pinned node digests with a removed outcome and an added outbound capability. Reuse facts, copy-field and notice with fictional host-owned diff and materiality. Prove explicit accessible text and reading order, narrow layout, long identifiers, keyboard copy, forced colors and the existing strict-CSP, Storybook, visual and accessibility checks. Record common inputs and divergent semantics, and recommend keeping the recipe or opening a bounded extraction follow-up for a future public element. Test-drive the reviewed verification and within-phase worktree procedure and capture exact proof and timings."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-25T20:04:29Z
---

# Triage 031 for the change-list discovery

## Issues read

Issue #75 asks whether plan revision review and pinned node upgrades share a presentation contract. Its deliverables are two executable Storybook examples and a recommendation. The issue is open with no comments, labels, milestone or sub-issues. The parent is #93. The issue timeline cross-references #76, and search found no competing change-list pull request. [Issue #75](https://github.com/Ocelle-HQ/ocelle-components/issues/75)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #75 | Comparison discovery | In scope | Two realistic consumers provide evidence for the recipe or extraction decision. |
| #13 and #14, specs 013 and 014 | Facts and copy field | Landed prerequisites | Facts supplies related labels and values. The copy field requests copying and the fixture host supplies the result. |
| #7 and the notice documentation | Status presentation | Out of scope | The existing notice can present a host-supplied explanation or copy result. New status conventions belong with their own issues. |
| #15, mission 009 and PR #46 | Responsive workflow composition | Precedent | Use the inspector and narrow-layout examples for composition. |
| #72, #73 and #74 | Workflow node, canvas and textarea | Out of scope | These independently landed surfaces support other Studio journeys. The comparison fixtures can use static plan and version inputs. |
| #76 | Workflow Studio integration | Consumes the outcome | Its Catalog upgrade journey explicitly depends on #75. Version admission, pinning and acceptance stay with the Studio composition. |
| #93 | Shared console UI epic | Parent | The discovery belongs to this epic and has independent acceptance criteria. |
| Op 025 and reviewed Op 028 | Verification and worktrees | Apply to the pilot | Capture exact review and hosted evidence. Parallelize eligible fixture tasks inside an approved phase, with one owner for shared integration. |

## Decision

**Mission, with no package release impact.** The issue asks for a design decision supported by two distinct consumer workflows and accessible browser evidence. The recipe and recommendation can ship independently of #76. A future public ocelle-change-list contract would require its own bounded scope and review.

## Scope

- Build a plan revision example with explicit previous and new values in reading order for the retention change, plus an unchanged field that remains identifiable.
- Build a pinned-node upgrade example with labeled previous and new digests, a named removed outcome and an added outbound capability. Use facts, copy-field and notice with host-supplied values and results.
- Prove that each comparison is legible at narrow widths and in forced colors, and that long identifiers remain usable. Exercise keyboard copy through the real control's request and preserve meaningful text and reading order independently of layout and color. Use the repository's Storybook, strict CSP, visual baseline and accessibility conventions.
- Compare the structure and meaning supplied by both consumers, record the tradeoffs and recommend keeping a composition recipe or opening a bounded extraction follow-up. Keep diff computation, materiality, policy, Catalog admission and upgrade services with the hosts.
- Exercise the improved workflow on this mission. Record elapsed time to an integrated candidate and hosted green. Use disjoint fixture assignments only after an approved plan establishes the common requirements and path ownership. Product mutation comparison can use a separate source-bearing workflow replay when the fixtures touch no mutation-eligible source.

## Risks and open questions

- The plan's unchanged values and the upgrade's added or removed records may share labels and reading order while differing in domain meaning. Test whether the same recipe can represent those distinctions without requiring consumers to manufacture an artificial previous or new value.
- Verify digest copy payloads through the existing request contract and ensure the fictional host reports results while keyboard focus stays usable.
- Check shared style, story registration, fixture paths and baseline ownership before parallel work. Measure staging time alongside worker time.

## What would change this decision

A necessary public API change, a requirement to implement live upgrade behavior, or a need to change the existing facts, copy-field or notice contracts would require separate scope. The comparison and recommendation can proceed with the selected fixture inputs.
