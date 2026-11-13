// fail-indexeddb: indexedDB.open.
export default { title: "Indexed DB" };

/** Makes indexedDB.open while it renders. */
export const Call = {
  render: (): string => {
    indexedDB.open("ocelle-plant");
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
