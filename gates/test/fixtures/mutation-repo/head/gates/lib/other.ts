// Fixture gate source: the change adds a function that an in-process test checks.
export function increment(value: number): number {
  return value + 1;
}

export function decrement(value: number): number {
  return value - 1;
}
