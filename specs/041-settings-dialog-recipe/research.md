# Research

## Modal sizing

Use the dialog's documented panel and body parts to constrain the dialog and give the recipe a bounded layout area. The public inline-size token sets the preferred width. The overlay retains the native modal, heading, backdrop and close behavior. Bound both split columns inside the body so tall expanded navigation and long detail have separate scroll offsets. On stacked layouts the dialog body provides vertical overflow. A content-driven panel would shift its header as content changes.

## Independent controls

Use the nav item for destinations and the disclosure for expansion. The disclosure already supplies a named native summary, expanded state and sliding motion with reduced-motion handling. Supply a decorative empty icon slot to replace its default chevron, and give the separate summary visible text. Keep visible category and section heading context outside the collapsible navigation. Combining category selection with toggling would eliminate independent routes.

## Scroll axes

Use the named library scroller for supplementary inline choices after the first panel action within the detail pane. It is an inline-axis control and gets a Tab stop while it overflows. Choose wrapping based on available inline space relative to text size for narrow and enlarged-text cases. The scroller’s intrinsic max-content track gives wrapping children room to stay on one line. Derive the slotted group’s size limit from the full-width recipe wrapper outside the track and subtract the two token-based focus clearances the track adds. Use a border-box limit so the group’s own padding is included. A separate named content region after the first action owns vertical overflow in the split layout and becomes keyboard-focusable while scrollable.

## Recipe fixture

Share a recipe module and stylesheet with Storybook and the strict-CSP browser fixture. Follow the Pane action footer pattern so the test exercises production-shaped composition with external scripts and styles. Use a neutral, recorded source scaffold before adding behavior tests. Import the actual recipe in the retained in-process Storybook browser project to cover changed host mutations. Keep initially open landing and detail stories with exposed navigation in both pinned visual themes and axe; opener-driven interaction stays in the browser tests.
