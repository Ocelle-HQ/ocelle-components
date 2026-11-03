// Plant: the promise is explicitly voided.
export function load(): Promise<number> {
  return Promise.resolve(1);
}

void load();
