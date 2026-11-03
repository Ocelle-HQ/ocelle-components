// Plant: a promise that is neither awaited, returned nor voided.
export function load(): Promise<number> {
  return Promise.resolve(1);
}

load();
