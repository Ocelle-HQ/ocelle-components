// fail-cookie: a document.cookie write.
export default { title: "Cookie" };

/** Makes a document.cookie write while it renders. */
export const Call = {
  render: (): string => {
    document.cookie = "ocelle-plant=1";
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
