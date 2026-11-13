// fail-exec-copy: document.execCommand("copy") (analysis C1).
export default { title: "Exec copy" };

/** Makes document.execCommand("copy") (analysis C1) while it renders. */
export const Call = {
  render: (): string => {
    document.execCommand("copy");
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
