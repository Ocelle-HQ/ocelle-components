// fail-no-box: the story root holds only elements with no box (display: none), their text never drawn.
export default { title: "No box" };

export const Hidden = { render: (): string => '<div hidden><p>Hidden text</p></div><p hidden>More hidden text</p>' };
