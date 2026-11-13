// pass-minor-only: a heading that skips a level, a moderate heading-order violation, and nothing serious.
export default { title: "Minor only" };

export const Headings = { render: (): string => "<h1>A title</h1><h3>A heading that skips a level</h3><p>Readable text</p>" };
