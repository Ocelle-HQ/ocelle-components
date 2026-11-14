// fail-websocket: a WebSocket to the origin (analysis C1).
export default { title: "Web socket" };

/** Makes a WebSocket to the origin (analysis C1) while it renders. */
export const Call = {
  render: (): string => {
    const socket = new WebSocket(`ws://${location.host}/socket`);
    socket.onerror = () => undefined;
    return "<p>A story that makes run-time I/O while it renders</p>";
  },
};
