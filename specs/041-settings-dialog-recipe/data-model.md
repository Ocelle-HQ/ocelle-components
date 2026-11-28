# Data model

- **Category** has a stable identifier, label and ordered list of sections.
- **Section** has an identifier within its category, a heading, content and labeled actions.
- **Destination** identifies a category landing panel or a section detail. Exactly one destination is current while open. Derive visible category and section heading context from that destination even when its child link is hidden.
- **Expansion** is the set of disclosed categories, independent of the destination.
- **Dialog session** holds the current destination while open. The existing dialog owns top-layer state and opener focus return.

Render supplied text through text nodes. Let the host supply fictional examples and handle action intents. Treat navigation and disclosure as separate transitions. If collapse hides a focused descendant, move focus to that category's disclosure summary.
