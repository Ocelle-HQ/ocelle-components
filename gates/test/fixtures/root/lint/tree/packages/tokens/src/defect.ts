export function ping(): Promise<number> {
  return Promise.resolve(1);
}

ping();
