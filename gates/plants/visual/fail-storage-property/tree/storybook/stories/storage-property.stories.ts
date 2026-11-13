// fail-storage-property: a named-property write, localStorage.k = "v", with no method call (research.md R-14).
export default { title: "Storage property" };

/** Makes a named-property write, localStorage.k = "v", with no method call (research.md R-14) while it renders. */
export const Call = {
  render: (): string => {
    (localStorage as unknown as Record<string, string>).k = "v";
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
