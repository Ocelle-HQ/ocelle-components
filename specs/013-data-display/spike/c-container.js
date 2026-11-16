// Question C: container-type:inline-size vs shrink-to-fit contexts; flex-wrap alternative
const { withBrowser } = require('./harness');

const SCRIPT = `
customElements.define('x-cq', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block;container-type:inline-size} .row{display:grid;grid-template-columns:fit-content(50%) 1fr;gap:8px} @container (max-width: 320px){ .row{grid-template-columns:1fr} }</style><div class="row"><span class="l">Owner label</span><span class="v">Ada Lovelace, value text</span></div>';}});
customElements.define('x-wrap', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:flex;flex-wrap:wrap;column-gap:16px;row-gap:4px} .l{flex:0 1 10rem} .v{flex:1 1 12rem;min-width:0}</style><span class="l">Owner label</span><span class="v">Ada Lovelace, value text</span>';}});
customElements.define('x-grid', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:grid;grid-template-columns:fit-content(50%) minmax(0,1fr);column-gap:16px}</style><span class="l">Owner label</span><span class="v">Ada Lovelace, value text</span>';}});
`;
const CTX = {
  'dialog showModal()': (t) => `<dialog id="d">${t}</dialog>`,
  'dialog showModal() width:300px': (t) => `<dialog id="d" style="width:300px;padding:0">${t}</dialog>`,
  'flex item (parent display:flex, no child width)': (t) => `<div style="display:flex;width:800px">${t}</div>`,
  'block 600px': (t) => `<div style="width:600px">${t}</div>`,
  'block 300px': (t) => `<div style="width:300px">${t}</div>`,
};
(async () => {
  await withBrowser(async (browser) => {
    for (const tag of ['x-cq', 'x-wrap', 'x-grid']) for (const [cn, wrap] of Object.entries(CTX)) {
      const page = await browser.newPage();
      await page.setContent(`<!doctype html><title>t</title><body>${wrap(`<${tag}></${tag}>`)}<script>${SCRIPT}</script></body>`);
      await page.evaluate(() => document.getElementById('d')?.showModal());
      const m = await page.evaluate((tag) => {
        const h = document.querySelector(tag), r = h.getBoundingClientRect();
        const q = (s) => { const e = h.shadowRoot.querySelector(s).getBoundingClientRect(); return { x: Math.round(e.x), y: Math.round(e.y), w: Math.round(e.width) }; };
        const l = q('.l'), v = q('.v');
        return { hostW: Math.round(r.width), hostH: Math.round(r.height), label: l, value: v, layout: v.y > l.y ? 'stacked' : 'row' };
      }, tag);
      console.log(`${tag} | ${cn}: ${JSON.stringify(m)}`);
      await page.close();
    }
  });
})();
