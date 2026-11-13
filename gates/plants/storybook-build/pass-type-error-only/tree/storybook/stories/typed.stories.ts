// A story file with a type error that is valid syntax: the build does not type-check, so it builds (the typecheck
// gate's finding, not this gate's).
export default { title: "Typed" };

const count: number = "not a number";

export const Typed = { render: (): string => `<p>${String(count)}</p>` };
