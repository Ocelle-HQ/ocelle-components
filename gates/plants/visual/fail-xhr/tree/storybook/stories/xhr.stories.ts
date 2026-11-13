// fail-xhr: an XMLHttpRequest for /api/items (analysis C1).
export default { title: "XHR" };

/** Makes an XMLHttpRequest for /api/items (analysis C1) while it renders. */
export const Call = {
  render: (): string => {
    const request = new XMLHttpRequest();
    request.open("GET", "/api/items");
    request.send();
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
