// fail-render-throws: the render function throws.
export default { title: "Render throws" };

export const Thrown = {
  render: (): string => {
    throw new Error("this story's render throws");
  },
};
