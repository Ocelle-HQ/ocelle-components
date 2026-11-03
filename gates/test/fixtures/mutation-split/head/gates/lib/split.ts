// Fixture gate source: the change adds two functions; an in-process test checks only the second.
export function keep(value: number): number {
  return value;
}

export function untested(value: number): number {
  return value - 1;
}

export function tested(value: number): number {
  return value + 1;
}
