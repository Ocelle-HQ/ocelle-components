// A story file whose import does not resolve: the indexer reads it, Vite's build fails naming this file.
import "./no-such-module.ts";

export default { title: "Missing" };

export const Missing = { render: (): string => "<p>missing</p>" };
