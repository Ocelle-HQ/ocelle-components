// Question B: progress bar naming
const { withBrowser, axTree, axe, fmtAxe } = require('./harness');

const DEFS = {
  'B1 native <progress> in shadow, aria-label from label': `
    customElements.define('ocelle-progress', class extends HTMLElement {
      constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<progress></progress>';}
      connectedCallback(){ const p=this.shadowRoot.querySelector('progress');
        if (this.hasAttribute('value')) p.value=+this.getAttribute('value'); else p.removeAttribute('value');
        p.max=+(this.getAttribute('max')||100);
        if (this.hasAttribute('label')) p.setAttribute('aria-label', this.getAttribute('label'));
        if (this.hasAttribute('valuetext')) p.setAttribute('aria-valuetext', this.getAttribute('valuetext')); } });`,
  'B2 shadow <div role=progressbar aria-*>': `
    customElements.define('ocelle-progress', class extends HTMLElement {
      constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<div role="progressbar" aria-valuemin="0"></div>';}
      connectedCallback(){ const p=this.shadowRoot.querySelector('div');
        p.setAttribute('aria-valuemax', this.getAttribute('max')||100);
        if (this.hasAttribute('value')) p.setAttribute('aria-valuenow', this.getAttribute('value'));
        if (this.hasAttribute('label')) p.setAttribute('aria-label', this.getAttribute('label'));
        if (this.hasAttribute('valuetext')) p.setAttribute('aria-valuetext', this.getAttribute('valuetext')); } });`,
  'B3 ElementInternals role=progressbar on host': `
    customElements.define('ocelle-progress', class extends HTMLElement {
      constructor(){super(); this.i=this.attachInternals(); this.i.role='progressbar'; this.attachShadow({mode:'open'}).innerHTML='<div part="track"><div part="bar"></div></div>';}
      connectedCallback(){ const i=this.i; i.ariaValueMin='0'; i.ariaValueMax=String(this.getAttribute('max')||100);
        if (this.hasAttribute('value')) i.ariaValueNow=this.getAttribute('value');
        if (this.hasAttribute('label')) i.ariaLabel=this.getAttribute('label');
        if (this.hasAttribute('valuetext')) i.ariaValueText=this.getAttribute('valuetext'); } });`,
};

const CASES = {
  determinate: '<ocelle-progress label="Uploading" value="30" max="100"></ocelle-progress>',
  'determinate+valuetext': '<ocelle-progress label="Uploading" value="3" max="10" valuetext="3 of 10 files"></ocelle-progress>',
  indeterminate: '<ocelle-progress label="Loading"></ocelle-progress>',
  'host aria-label override': '<ocelle-progress label="Uploading" aria-label="Host name" value="30"></ocelle-progress>',
  'host aria-label only (no label)': '<ocelle-progress aria-label="Host name" value="30"></ocelle-progress>',
  'no name at all': '<ocelle-progress value="30"></ocelle-progress>',
};

(async () => {
  await withBrowser(async (browser) => {
    console.log('Chromium', browser.version());
    for (const [vn, script] of Object.entries(DEFS)) for (const [cn, markup] of Object.entries(CASES)) {
      const page = await browser.newPage();
      await page.setContent(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>P</h1>${markup}</main><script>${script}</script></body></html>`);
      console.log(`\n=== ${vn} | ${cn}: ${markup}`);
      console.log((await axTree(page)).split('\n').slice(5).join('\n'));
      console.log(fmtAxe(await axe(page, ['aria-progressbar-name', 'aria-valid-attr-value', 'aria-allowed-attr', 'aria-required-attr', 'aria-prohibited-attr'])));
      await page.close();
    }
    // native indeterminate check outside shadow + CSS styling sanity
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html lang="en"><head><title>t</title><style>progress{appearance:none;height:8px;width:200px} progress::-webkit-progress-bar{background:#ddd} progress::-webkit-progress-value{background:rebeccapurple}</style></head><body><progress aria-label="Light DOM indeterminate"></progress><progress aria-label="Light DOM determinate" value="40" max="100"></progress></body></html>`);
    console.log('\n=== light-DOM native <progress> (indeterminate + determinate), styled via appearance:none + ::-webkit-progress-*');
    console.log((await axTree(page)).split('\n').slice(3).join('\n'));
    console.log('matches(:indeterminate):', await page.evaluate(() => [...document.querySelectorAll('progress')].map(p => p.matches(':indeterminate'))));
    await page.close();
  });
})();
