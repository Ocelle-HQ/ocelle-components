// fail-clipboard-write: navigator.clipboard.writeText, recorded whether its promise resolves or rejects (analysis C1).
export default { title: "Clipboard write" };

/** Makes navigator.clipboard.writeText, recorded whether its promise resolves or rejects (analysis C1) while it renders. */
export const Call = {
  render: (): string => {
    void navigator.clipboard.writeText("ocelle").catch(() => undefined);
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
