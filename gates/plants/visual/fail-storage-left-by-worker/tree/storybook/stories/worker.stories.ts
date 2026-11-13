// fail-storage-left-by-worker: a worker leaves an IndexedDB database.
export default { title: "Storage left by worker" };

/** Starts a dedicated worker that opens the database ocelle-left, and resolves when it is open. */
const leaveDatabase = (): Promise<void> =>
  new Promise((resolve) => {
    const source = 'const request = indexedDB.open("ocelle-left"); request.onsuccess = () => postMessage("open");';
    const worker = new Worker(URL.createObjectURL(new Blob([source], { type: "text/javascript" })));
    worker.onmessage = () => resolve();
  });

export const Worker_ = {
  name: "Worker",
  loaders: [async (): Promise<Record<string, never>> => (await leaveDatabase(), {})],
  render: (): string => "<p>A story whose worker left a database</p>",
};
