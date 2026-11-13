// fail-outside-root: the story appends an unlabelled button to document.body, outside its root.
export default { title: "Outside root" };

export const Portal = {
  render: (): string => {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "plant-portal";
    document.body.append(button);
    return "<p>The story root's own content</p>";
  },
};
