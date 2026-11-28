# Research

## Modal sizing

Use the dialog's documented panel and body parts to constrain the dialog and give the recipe a bounded layout area. The public inline-size token sets the preferred width. The overlay retains the native modal, heading, backdrop and close behavior. A content-driven panel would shift its header as content changes.

## Independent controls

Use the nav item for destinations and the disclosure for expansion. The disclosure already supplies a named native summary, expanded state and sliding motion with reduced-motion handling. Supply a decorative empty icon slot to replace its default chevron, and give the separate summary visible text. Combining category selection with toggling would eliminate independent routes.

## Scroll axes

Use the library scroller for supplementary inline choices within the detail panel. It is an inline-axis control. Vertical overflow belongs to the CSS-constrained detail pane, with the existing dialog body available for vertical overflow in the stacked layout.

## Recipe fixture

Share a recipe module and stylesheet with Storybook and the strict-CSP browser fixture. Follow the Pane action footer pattern so the test exercises production-shaped composition with external scripts and styles. Use the pinned Storybook visual workflow for both themes.
