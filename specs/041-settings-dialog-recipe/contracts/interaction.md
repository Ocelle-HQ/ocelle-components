# Recipe interaction contract

- Selecting a category shows its landing panel and focuses its heading. The next Tab reaches the first section destination.
- Selecting a section shows its detail and focuses its heading. The next Tab reaches its first action.
- Toggling a category changes its expanded state and visibility of its child destinations. The current panel and its selected state remain intact. Collapsed child destinations leave sequential focus.
- The named Close and Escape use the dialog's existing close flow. Focus returns to the opener. While open, keyboard focus cycles within the modal.
- The desktop content pane scrolls independently. The stacked layout keeps category navigation before content in reading and focus order and keeps Close reachable.
