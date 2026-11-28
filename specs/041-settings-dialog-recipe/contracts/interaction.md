# Recipe interaction contract

- Selecting a category shows its landing panel and focuses its heading. The next Tab reaches the first section destination.
- Selecting a section shows its detail and focuses its heading. The next Tab reaches its first action.
- Toggling a category changes its expanded state and visibility of its child destinations. The current panel remains intact. Its visible heading context identifies its category and section, including when entered from a landing panel while its navigation group is collapsed. Current-link semantics stay attached to that destination. Collapsed child destinations leave sequential focus.
- The named Close and Escape use the dialog's existing close flow. Focus returns to the opener. While open, keyboard focus cycles within the modal.
- The desktop columns scroll independently. After the first panel action, a named overflowing vertical detail region can receive keyboard focus and scroll to its end. The supplementary horizontal scroller follows the first action, has a meaningful name when overflowing and responds to arrow keys. At narrow widths and 200% text all choices wrap into reach without horizontal scrolling. The stacked layout keeps category navigation before content in reading and focus order and keeps Close reachable.
