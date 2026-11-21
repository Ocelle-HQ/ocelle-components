---
triage: 022
issues: [57]
decision: op
target: "ops/022-focus-trap-details-icon-name"
in_scope: [57]
out_of_scope: [1, 49, 54]
semver: patch
spec_prompt: "Op for #57 (triage/022-focus-trap-details-icon-name.md): two local accessibility fixes, each red first in a browser body before the source changes: (1) packages/elements/src/focusable.ts rendered() also requires element.checkVisibility(), so a link inside a closed <details> is no Tab stop and Tab from the last real stop of an ocelle-dialog or ocelle-drawer wraps to its first stop; (2) a bare <svg> holding a <title> slotted into ocelle-button's icon slot has no accessibility-tree node and adds nothing to the button's name; no new element, attribute, event, slot, part or token; a Fixed entry in packages/elements/CHANGELOG.md and the README sentences that state the behaviour; lands after #49 and #54."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-20T12:06:53Z
---

# Triage 022: focus trap counts a closed `<details>` link; button icon slot names a bare `<svg>` (#57)

## Issues read

- **#57.** This session could not read GitHub: the proxy refuses GraphQL (`gh issue view`) and `gh api` was denied.
  The body, comments, labels, milestone, parent and linked pull requests of #57 are not read here. What this record
  knows of #57 is the operator's brief and the evidence it points to:
  - #57 reports two defects, and the operator has chosen to handle both as **one small op**, test-first, semver
    patch, with a CHANGELOG entry:
    1. `packages/elements/src/focusable.ts` counts a link inside a closed `<details>` as a Tab stop, so the focus
       trap of `ocelle-dialog` and `ocelle-drawer` lets Tab escape.
    2. `ocelle-button`'s icon slot can expose a bare `<svg><title>` and add the title to the button's name.
  - Landing queue: #49, then #54; this op lands after them.
- **Evidence, mission 020** (`origin/claude/013-disclosure-code-block:specs/020-disclosure-code-block/research.md`
  § Repository-wide notes for the orchestrator). Both defects were found by 020's squad and deliberately left for a
  separate op:
  - **Focus trap** (PLAN-FRESH-2-002, operator decision (b)). `rendered()` (`focusable.ts:52-53` on main) checks only
    `getClientRects().length` and computed `visibility`. Chromium hides a closed `details` panel with
    content-visibility, so a slotted link in a closed panel keeps a client rect and `visibility: visible` while
    `checkVisibility()` is false (**measured**). The walk counts it as the overlay's last stop, the summary becomes a
    middle stop, and `overlay.ts` `#tab` (710-744 on that branch's base) lets Tab run natively; focus lands on the body
    (**measured** with a `showModal()` dialog). `#onFocusout` (757-761) repairs only focus that leaves opaque
    content. A plain `details` in an overlay has the same defect today. Proposed fix: `rendered()` also requires
    `element.checkVisibility()`. 020 adds no body for it (a known-failing body is forbidden by Principle VIII and the
    test-quality lint) and its README states the limitation.
  - **Icon slot** (PLAN-A11Y-SECURITY-1-003; **not measured on `ocelle-button`**). The slot convention allows a bare
    `<svg>` (`packages/elements/README.md:1324`, § Slot convention), and `src/icon-slot.ts` adds no `aria-hidden`. In
    020's disclosure probe a titled bare svg kept an `image` node and added its title to the control's name. 020's
    own spec (US1 scenario 17) requires its disclosure not to do this, so 020 fixes it locally for its element.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #57 | issue | in scope | This op. |
| `packages/elements/src/focusable.ts:52-53` `rendered()`; used at `:113` (sequential stops) and `:146` (scroll containers as stops) | source (main) | **changed by this op, red first** | The defect's site. The fix applies to both call sites, so a scroll container inside a closed `details` also stops counting; the plan states that and the body covers the link case. |
| `packages/elements/src/overlay.ts` (imports `walk`, `flatChildren`, `isOpaqueContent`, `deepActive`) | source (main, mission 008) | consumer; expected unchanged | The trap's wrap logic is correct once the walk is; the op should not change `#tab` or `#onFocusout`. If the red body shows it must, see "What would change this decision". |
| `packages/elements/src/ocelle-tooltip.ts` (imports `deepActive` only) | source (main) | unaffected | Does not use `rendered()`. |
| `packages/elements/src/ocelle-button.ts:504` (`<span class="icon-slot" ?hidden=${busy}><slot name="icon">`) | source (main, mission 012) | **changed by this op, red first** | The icon wrapper has no `aria-hidden`; the button's name can take a titled svg's text. |
| `packages/elements/src/icon-slot.ts` (`iconSlotStyles`, the convention's comment: "No generated content, so the control's name is its label's") | source (main, mission 005/012) | checked; comment may change | Styles only. The claim in its comment is the one #57 shows false for a titled bare svg; the comment is corrected if the fix lands in the markup. |
| `packages/elements/src/ocelle-action-row.ts:647` (icon wrapper without `aria-hidden`; its trailing wrapper at `:664` has one) | source (main, mission 012) | **out of scope unless measured the same** (Q2) | Same convention, same possible gap. Its name comes from `#name()`, so it may already be safe. The op measures it in one body; see Q2. |
| `packages/elements/src/spinner.ts`, `control.ts` | source (main) | unaffected | Use the convention's styles; no icon slot of their own. |
| `packages/elements/README.md:786-790` (`ocelle-button` icon slot), `:1320-1345` (§ Slot convention) | docs (main) | **changed by this op** | One sentence each: a slotted icon is decorative and adds nothing to the control's name; name an icon-only button with `label`. |
| `packages/elements/README.md` dialog and drawer sections | docs (main) | **changed by this op** if they describe the trap's stops | One sentence: content of a closed `details` is not a stop. |
| `packages/elements/CHANGELOG.md` § Unreleased | changelog | **changed by this op** | A `### Fixed` entry for both defects. |
| `specs/020-disclosure-code-block` (branch `origin/claude/013-disclosure-code-block`, in progress) | mission in progress | out of scope; **evidence and consumer** | Not a fold target: its operator decided (b) to leave mission 008's modules unchanged, and it fixes its own icon locally. After this op lands, 020's README limitation sentence becomes false and 020 should drop it when it merges main; and 020 may then add the overlay body it could not add. Its local `aria-hidden` stays correct either way. |
| `specs/008-overlays` (merged `13af7a9`, #47) | mission, merged | out of scope | Origin of `focusable.ts` and the trap; its decisions stand. |
| `specs/012-button-action-row` (merged `4911fd0`, #50) | mission, merged | out of scope | Origin of `ocelle-button`'s icon slot; the fix is a patch to its behaviour, not a new surface. |
| `specs/005-icons-brand-mark` | mission, merged | out of scope | Origin of the slot convention that allows a bare `<svg>`; that permission stays. |
| #49, #54 | pull requests or issues ahead in the landing queue | out of scope; **land before this op** | Operator's queue. Not read here; whether they touch `focusable.ts`, `ocelle-button.ts`, the README or the CHANGELOG is unknown, so the op rebases on main after both land and resolves the CHANGELOG and README mechanically. |
| #1 | epic (open) | out of scope | Parent epic. Whether #57 is its sub-issue was not read. |
| `ops/004`, `ops/015`, `ops/016`; triage 015, 016 | ops, precedent | out of scope | Op shape and record format. |
| `knowledge/speckit-flows/guards/vacuous-tests.md`, `findings/frontend-missions.md` | guards and findings | applies | Each body must fail before its fix for the stated reason (red first, not a vacuous pass); one heavy browser job at a time. |

I could not search GitHub, so other issues or pull requests on the focus trap or the icon slot may exist. The
operator should check that before approval.

## Decision

**op.** Both defects are local fixes with a clear expected behaviour, and each has a stated, mostly measured cause:

- The focus trap must wrap Tab from the last real stop to the first; a link the user cannot see is not a stop. The
  fix is one condition in one private function.
- A slotted icon in `ocelle-button` must add nothing to the button's name, which is what the README already promises
  for the convention ("adds nothing" / "the control's name is its label's"). The fix is one attribute in one template,
  or the equivalent.

No element, attribute, event, slot, part or token is added or changed; behaviour moves toward what the documentation
already says (semver **patch**). Together they fit one phase: two red bodies, two small source changes, the README
sentences and a CHANGELOG entry.

Why not the others:
- **Not a mission.** Accessibility behaviour is touched, but only as local fixes that restore documented behaviour,
  with no design question left open once Q1 is answered (a choice between two concrete one-line fixes). One package,
  no new surface, no user story beyond "the documented behaviour holds". Governance errs toward review, and the op
  still runs the same test-first implementation and review loop.
- **Not a fold.** 020 is the only work in progress near this, and its operator already decided (b) not to change
  mission 008's modules there; folding would reverse that and tie the fix to 020's landing.
- **Not none.** On main `rendered()` has no `checkVisibility()` (`focusable.ts:52-53`) and `ocelle-button.ts:504` has
  no `aria-hidden` on its icon wrapper; nothing in the repository fixes either.
- **Not decision-needed.** The operator has decided the shape (one op, both defects, patch, CHANGELOG); the remaining
  choices have recommended answers for approval.

## Scope

In scope (#57):
1. **Focus trap, red first.** A browser body in the dialog tests (and the same in the drawer tests): an
   `ocelle-dialog`, opened, whose last control is a `<details>` (closed) holding a link in its panel; focus on the
   summary, Tab, and focus is on the dialog's first stop. It fails on main (focus on the body). Then `rendered()`
   requires `element.checkVisibility()` as well. A second body: open the `details`, Tab from the summary reaches the
   link. A unit-level body on `walk` may replace one of the two overlay bodies if the plan shows the walk is the
   single point both share.
2. **Icon name, red first.** A browser body: an `ocelle-button` with a label and a bare `<svg>` holding a `<title>` in
   the `icon` slot; the button's computed name is the label alone and the svg has no accessibility-tree node. Same for
   an icon-only button named with `label`. It fails on main (measure first; if it passes on main, see "What would
   change this decision"). Then the fix chosen at Q1.
3. **Mutation.** The mutation gate's run over the changed lines kills the mutants of both changes (removing the
   `checkVisibility()` condition; removing the `aria-hidden`). 020's note calls this a plant; in this repository it
   is the mutation gate's job, and no gate plant is needed because no gate changes.
4. **Docs.** `packages/elements/README.md`: the button's icon slot and § Slot convention say a slotted icon adds
   nothing to the control's name; the dialog and drawer sections, if they list what counts as a stop, say content of
   a closed `details` is none. `icon-slot.ts`'s comment if Q1 changes where the guarantee lives.
   `packages/elements/CHANGELOG.md` § Unreleased gains `### Fixed` with both entries.
5. **Stories and baselines.** None expected: no visual change. If Q1 B changes rendering, the plan says so.

Out of scope:
- `overlay.ts` `#tab` and `#onFocusout` (expected unchanged).
- Any change to the slot convention's permission to slot a bare `<svg>`.
- `ocelle-action-row`'s icon slot unless Q2 brings it in.
- 020's README limitation sentence and its local fix (020's to drop or keep when it merges main).
- Engines outside the floor (Chromium 135, WebKit 17.4); `checkVisibility()` is available on both.

## Risks and open questions

**Q1, where the icon fix lives** (choose one):
- **A (recommended), `aria-hidden="true"` on `ocelle-button`'s icon wrapper.** The same pattern `ocelle-action-row`
  already uses for its trailing wrapper (`ocelle-action-row.ts:664`). It hides anything slotted as an icon, including
  an `ocelle-icon` with a `label`: the README already says to name an icon-only button with `label`, so the icon's own
  label was never the button's name by contract. The plan must check that the button's current name computation
  (`label`, or the default slot's text) does not read the icon slot at all.
- **B, in the convention for every control.** `iconSlotStyles` cannot set ARIA, so this means a shared template helper
  or a rule in every control that uses the convention. Broader, and it touches 020's element in flight. Not
  recommended for a small op.

**Q2, `ocelle-action-row`'s icon slot** (choose one):
- **A (recommended), measure and report.** The op adds one measuring step (not a committed failing body): a titled bare
  svg in an action row's `icon` slot. If the row's name is unaffected and the svg has no node, nothing changes. If it
  shows the same gap, the op reports it and the operator decides at the next gate whether to take the same one-attribute
  fix here (still patch) or open an issue.
- **B, include it now.** Treat both controls the same from the start; one more body and one more attribute.
- **C, leave it.** Not measured here; a separate issue if anyone finds it.

**Other risks:**
- **Unmeasured on `ocelle-button`.** The icon defect was seen on 020's disclosure probe, not on the button. The red
  body is the measurement: if it passes on main, the button half of #57 is **none** for this op and the record says so.
- **Wider reach of `checkVisibility()`.** It is also false for `content-visibility: hidden` and `display: none`
  subtrees beyond `details`; both are correct non-stops. It also applies at `:146`, scroll containers as stops. The
  plan lists the existing focus-trap bodies that must stay green (the full dialog and drawer suites).
- **Landing order.** After #49 and #54. CHANGELOG § Unreleased and the README are edited by every mission; expect
  mechanical conflicts only.
- **GitHub not read.** #57's comments may name more cases or a preferred fix; the operator should check before
  approval.

## What would change this decision

- If the red body shows `overlay.ts` `#tab` or `#onFocusout` must change as well, or that other hidden-content cases
  (a closed `ocelle-*` disclosure, `inert`, `hidden=until-found`) need their own behaviour, the trap work needs a
  design decision and becomes a **mission** (or a separate one, splitting the icon half off as its own op).
- If the operator picks Q1 B, the fix spans every control using the convention, including 020's element in flight:
  still an op if it is one shared helper, a **mission** if it changes the convention's documented contract.
- If the button body passes on main, the icon half is **none** (already correct), and the op is the focus trap alone.
- If #57's unread comments or #49 or #54 already fix either defect, that half is **none** (cite the commit or PR) or a
  **fold** into that work.
