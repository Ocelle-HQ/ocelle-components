// fail-same-origin-fetch: a same-origin fetch of /api/items.
export default { title: "Same origin fetch" };

/** Makes a same-origin fetch of /api/items while it renders. */
export const Call = {
  render: (): string => {
    void fetch("/api/items").catch(() => undefined);
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
