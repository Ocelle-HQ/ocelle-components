// pass-second-render: a different picture on any render after the first in a page.
export default { title: "Second render" };

let renders = 0;

const sheet = `<style>.plant-block { width: 200px; height: 120px; background: var(--ocelle-color-link); }</style>`;

export const Block = {
  render: (): string => {
    renders += 1;
    return renders > 1 ? `${sheet}<p>A later render</p><div class="plant-block"></div>` : "<p>The first render in this page</p>";
  },
};
