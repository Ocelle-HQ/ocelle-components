// error-build-fails: a story file with a syntax error.
export default { title: "Broken" };

export const Broken = { render: () => { return ( ; } };
