// Plant for the content-security check: a story whose markup holds a style attribute, outside the gate's scope.
export default { title: "Plant/Out of scope" };

export const Styled = { render: (): string => '<p style="color: red">x</p>' };
