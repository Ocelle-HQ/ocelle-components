// fail-random: a random value in the markup.
export default { title: "Random" };

export const Value = { render: (): string => `<p>A random value: ${String(Math.random())}</p>` };
