// fail-throws-on-load: the module throws when it is loaded.
export default { title: "Throws on load" };

throw new Error("this story module throws when it is loaded");

export const Loaded = { render: (): string => "<p>Never shown</p>" };
