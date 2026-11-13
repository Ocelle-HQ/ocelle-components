// fail-local-storage: localStorage.setItem.
export default { title: "Local storage" };

/** Makes localStorage.setItem while it renders. */
export const Call = {
  render: (): string => {
    localStorage.setItem("ocelle-plant", "1");
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
