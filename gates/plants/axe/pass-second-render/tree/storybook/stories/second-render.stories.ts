// pass-second-render: the button loses its label on any render after the first in a page; every story-theme is audited
// in a fresh page (FR-028), so axe never sees the unlabelled one.
export default { title: "Second render" };

let renders = 0;

export const Button = {
  render: (): string => {
    renders += 1;
    return renders > 1 ? '<button type="button"></button>' : '<button type="button">Labelled</button>';
  },
};
