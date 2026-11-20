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

**Decision.** Use native anchors for both destination primitives. For the nav pill, carry forward the explicitly reviewed destination-link assumption until the plan squad checks consumer evidence. Use the standard control radius. Reuse the tooltip's visual and dismissal behavior where compatible, without wiring its duplicate label as an accessible description.

**Rationale.** [Consumer #500](https://github.com/spec-kitty/spec-kitty-design/issues/500) specifies a link and current state for the vertical item. [Consumer #470](https://github.com/spec-kitty/spec-kitty-design/issues/470) lists the nav pill without a keyboard contract. Native anchors retain browser navigation affordances. Link semantics leave selection widgets outside this scope.

**Alternative.** A tab or toggle would require a group and selection model that the approved spec does not define. Without new consumer evidence, keep those features with their own primitives.

## R4. Focus and native controls

**Decision.** Use composed focus utilities where applicable, local native semantics for current state and a native button for direct focus transfer by the skip link. Resolve first-match selectors in the containing root and verify a focus attempt actually changed the deep active element. Handle compact-bubble dismissal only when the bubble is open. Verify one Escape closes the bubble and a subsequent Escape reaches the modal.

**Rationale.** An ARIA ID or fragment cannot connect the relevant nodes across roots. Active element checks at only the document level conflate focus on different controls in the same host. Stop a handled Escape before the native dialog's default cancellation and test with real key input.

**Alternative.** Mutating arbitrary destination tabindex can alter subsequent tab order. Hosts can supply a programmatically focusable heading or main, and the shell's own main uses `tabindex="-1"`.

## R5. Upstream nav pill and overlay integration evidence

[Consumer library issue #73](https://github.com/spec-kitty/spec-kitty-design/issues/73) describes a responsive group of native destination links and an optional internal drawer. It supports link semantics for each destination while leaving open whether Desktop V2 needs the group as the public primitive. The drafted contract remains one destination per element pending plan review of the actual consumer composition.

The landed overlay chooses autofocus or the first flat-order focusable control when opening and emits its close event after releasing modality and restoring its opener. The shell must deliberately achieve the specified first destination in tab order, even when a drawer close control precedes it or a supplied destination uses positive tabindex. Reuse the existing focus traversal where possible. If the shell needs an overlay hook, keep standalone defaults and add regression coverage. Fence post-close focus work against a newer transition. Coordinate compact label dismissal with the overlay and any already-open tooltip, which currently uses a shared bubble controller.
