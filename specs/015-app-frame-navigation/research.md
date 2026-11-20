# Research — App frame and navigation

## R1. Responsive measurements

**Decision.** Share the supported-length parser, resolution and strict comparison from `packages/elements/src/tiers.ts`. Keep list-detail's tier policy separate. Measure the shell's logical border box with a resize observer. Keep the measured box independent of the tier's min-content contribution. Read computed offsets on observation or explicit recomputation, and cover fixed-width token and font changes with the recomputation path.

**Rationale.** The landed list-detail convention handles element-local sizing and exclusive thresholds. The shell must apply two ordered bounds and can reuse the grammar without changing list-detail behavior.

**Alternative.** Viewport media rules miss embedded frames. CSS-only queries cannot own the drawer lifecycle and focus recovery. Reject non-finite conversions at the shell boundary.

## R2. Responsive drawer composition

**Decision.** Project the same named slots into the wide regions or the existing drawer body. Keep assigned consumer nodes connected and keep main and top-bar trees stable. Verify nested slot flattening, focus and keyboard paths in Chromium with actual rail/sidebar controls before settling the implementation. Use one native modal drawer and the overlay's existing cancellation and completion contracts.

**Rationale.** Copying consumer links loses identity, state and custom listeners. A separate narrow link list creates synchronization and duplicate landmark risks. Projecting named slots preserves one set of consumer nodes while allowing the layout to change.

**Alternative.** A second consumer-supplied set of drawer destinations would simplify composition at the cost of duplicated consumer work. If the existing overlay's restoration races a topology change, add only the lifecycle integration required to coordinate it and retain standalone defaults.

## R3. Navigation semantics and bubble behavior

**Decision.** Use native anchors for the vertical item and each destination in the named, inline nav-pill group. Apply the standard control radius. Reuse the tooltip's visual and dismissal behavior where compatible. Omit a duplicate accessible description for the compact label.

**Rationale.** [Consumer #500](https://github.com/spec-kitty/spec-kitty-design/issues/500) specifies a vertical link and current state. The [immutable Desktop V2 handoff](https://github.com/spec-kitty/spec-kitty-design/blob/173774af635cf34aeb13ea03a3bdaa12c651557d/packages/styles/src/nav-pill/sk-nav-pill.html) shows a named navigation group with four native links and one current-page item. The separate CTA in that composition belongs in top-bar actions. The shell supplies the responsive drawer instead of the optional nav-pill modal mentioned in [consumer #73](https://github.com/spec-kitty/spec-kitty-design/issues/73). This implements the operator's decision in [round 1](reviews/plan/round-1/refute.md).

## R4. Focus and native controls

**Decision.** Use composed focus utilities where applicable, local native semantics for current state and a native button for direct focus transfer by the skip link. Resolve first-match selectors in the containing root and verify a focus attempt actually changed the deep active element. Give the currently visible bubble an ownership-aware capture path for Escape, including when a pointer-open bubble's trigger does not have focus. When a modal is active, handle Escape only if the bubble belongs to the top modal. Consuming that Escape dismisses the bubble and prevents the modal's cancellation for that key. With no owned bubble left, the next Escape belongs to the active modal. A newer modal owns Escape even if the pointer remains over an older bubble's trigger.

**Rationale.** An ARIA ID or fragment cannot connect the relevant nodes across roots. Active element checks at only the document level conflate focus on different controls in the same host. Stop a handled Escape before the native dialog's default cancellation and test with real key input.

**Alternative.** Mutating arbitrary destination tabindex can alter subsequent tab order. Hosts can supply a programmatically focusable heading or main, and the shell's own main uses `tabindex="-1"`.

## R5. Overlay integration and initial focus

The landed overlay chooses autofocus or the first flat-order focusable control when opening and emits its close event after releasing modality and restoring its opener. The shell must deliberately achieve the specified first destination in tab order, even when a drawer close control precedes it or a supplied destination uses positive tabindex. Reuse the existing focus traversal where possible. If the shell needs an overlay hook, keep standalone defaults and add regression coverage. Fence post-close focus work against a newer transition. Coordinate compact label dismissal with the overlay and the shared tooltip controller. The shell's initial focus choice is the first supplied sequential destination, including when another destination or the close control requests autofocus. The standalone overlay retains its own autofocus and fallback behavior.

## R6. Grouped sidebar presentation

Support grouped light-DOM navigation inside the landed context sidebar, including a section with a nested list of nav items. Keep shell-owned effective presentation separate from host compact input. Apply that presentation to each contained nav item and to sidebar chrome, without replacing consumer nodes or changing link identity. Test grouped label restoration both when expanding alongside the content and when opening the narrow drawer. Use neutral shell wrappers around existing navigation landmarks and supply a single named landmark for bare content. Test both compositions after projection into the drawer.
