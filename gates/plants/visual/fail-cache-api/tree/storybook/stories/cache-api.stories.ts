// fail-cache-api: caches.open (analysis C1).
export default { title: "Cache API" };

/** Makes caches.open (analysis C1) while it renders. */
export const Call = {
  render: (): string => {
    void caches.open("ocelle-plant").catch(() => undefined);
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
