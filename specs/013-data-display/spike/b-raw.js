// dump raw CDP AX nodes for progressbars with aria-valuetext (shadow div, internals, native)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage();
  await page.setContent(`<!doctype html><title>t</title><body>
  <x-a></x-a><x-b></x-b><x-c></x-c><div role="progressbar" aria-label="light" aria-valuenow="3" aria-valuemax="10" aria-valuetext="3 of 10 files (light)"></div>
  <script>
  customElements.define('x-a', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div role="progressbar" aria-label="A" aria-valuenow="3" aria-valuemin="0" aria-valuemax="10" aria-valuetext="3 of 10 files (div)"></div>'}});
  customElements.define('x-b', class extends HTMLElement{constructor(){super();const i=this.attachInternals();i.role='progressbar';i.ariaLabel='B';i.ariaValueNow='3';i.ariaValueMin='0';i.ariaValueMax='10';i.ariaValueText='3 of 10 files (internals)'}});
  customElements.define('x-c', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<progress aria-label="C" value="3" max="10" aria-valuetext="3 of 10 files (native)"></progress>'}});
  </script>`);
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  for (const n of nodes.filter(n => n.role?.value === 'progressbar')) console.log(JSON.stringify({ name: n.name?.value, value: n.value, props: n.properties, desc: n.description }));
  await b.close();
})();
