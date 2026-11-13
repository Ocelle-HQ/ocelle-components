// fail-beacon: navigator.sendBeacon (analysis C1).
export default { title: "Beacon" };

/** Makes navigator.sendBeacon (analysis C1) while it renders. */
export const Call = {
  render: (): string => {
    navigator.sendBeacon("/api/beacon");
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
