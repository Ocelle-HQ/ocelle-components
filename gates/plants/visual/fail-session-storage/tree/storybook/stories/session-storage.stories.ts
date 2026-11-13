// fail-session-storage: sessionStorage.setItem (analysis C1).
export default { title: "Session storage" };

/** Makes sessionStorage.setItem (analysis C1) while it renders. */
export const Call = {
  render: (): string => {
    sessionStorage.setItem("ocelle-plant", "1");
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
