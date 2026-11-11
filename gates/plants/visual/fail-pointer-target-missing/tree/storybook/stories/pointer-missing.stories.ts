// fail-pointer-target-missing: the hover selector matches nothing.
export default { title: "Pointer target missing" };

export const Hover = {
  parameters: { ocelle: { pointer: { hover: ".plant-absent" } } },
  render: (): string => "<p>A story whose hover target is not there</p>",
};
