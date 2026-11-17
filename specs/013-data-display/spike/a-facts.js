// Question A: description list via child custom elements
const { withBrowser, axTree, axe, fmtAxe } = require('./harness');

const CONSUMER = `<main><h1>Facts</h1>
<div id="wrap" style="width:600px">
<ocelle-facts><ocelle-fact label="Owner">Ada</ocelle-fact><ocelle-fact label="${process.env.LONG || "A considerably longer label"}"><span>abc-123</span></ocelle-fact></ocelle-facts>
</div></main>`;

const GRID = `display:grid; grid-template-columns: ${process.env.COLS || "fit-content(50%) minmax(0,1fr)"}; column-gap:16px;`;

// each variant: { name, script } — script defines both elements
const V = {
  'A1 dl>slot / fact dt+dd (fact host default display:inline)': `
    customElements.define('ocelle-facts', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>dl{${GRID}margin:0}</style><dl><slot></slot></dl>';}});
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<dt></dt><dd><slot></slot></dd>';} connectedCallback(){this.shadowRoot.querySelector('dt').textContent=this.getAttribute('label');}});`,
  'A1c dl>slot / fact dt+dd, fact :host{display:contents} (grid on shadow dl)': `
    customElements.define('ocelle-facts', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block} dl{${GRID}margin:0}</style><dl><slot></slot></dl>';}});
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:contents} dd{margin:0}</style><dt></dt><dd><slot></slot></dd>';} connectedCallback(){this.shadowRoot.querySelector('dt').textContent=this.getAttribute('label');}});`,
  'A1s dl>slot / fact dt+dd, fact subgrid': `
    customElements.define('ocelle-facts', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block} dl{${GRID}margin:0}</style><dl><slot></slot></dl>';}});
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:grid;grid-column:1/-1;grid-template-columns:subgrid} dd{margin:0}</style><dt></dt><dd><slot></slot></dd>';} connectedCallback(){this.shadowRoot.querySelector('dt').textContent=this.getAttribute('label');}});`,
  'A2a facts shadow <div> (no role) / fact role=term + role=definition, display:contents': `
    customElements.define('ocelle-facts', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block} div{${GRID}}</style><div><slot></slot></div>';}});
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:contents}</style><div role="term"></div><div role="definition"><slot></slot></div>';} connectedCallback(){this.shadowRoot.querySelector('[role=term]').textContent=this.getAttribute('label');}});`,
  'A2b facts internals.role=list / fact internals.role=listitem, shadow role=term + role=definition, subgrid': `
    customElements.define('ocelle-facts', class extends HTMLElement { constructor(){super(); this.attachInternals().role='list'; this.attachShadow({mode:'open'}).innerHTML='<style>:host{${GRID}}</style><slot></slot>';}});
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachInternals().role='listitem'; this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:grid;grid-column:1/-1;grid-template-columns:subgrid}</style><div role="term"></div><div role="definition"><slot></slot></div>';} connectedCallback(){this.shadowRoot.querySelector('[role=term]').textContent=this.getAttribute('label');}});`,
  'A2c facts internals.role=associationlist (ARIA 1.3 draft) / fact internals.role=associationlistitemkey? -> shadow role=associationlistitemkey/value': `
    customElements.define('ocelle-facts', class extends HTMLElement { constructor(){super(); this.attachInternals().role='associationlist'; this.attachShadow({mode:'open'}).innerHTML='<style>:host{${GRID}}</style><slot></slot>';}});
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:contents}</style><div role="associationlistitemkey"></div><div role="associationlistitemvalue"><slot></slot></div>';} connectedCallback(){this.shadowRoot.querySelector('div').textContent=this.getAttribute('label');}});`,
  'A3 dl>slot / fact dt+dd, fact display:contents + internals.role=none': `
    customElements.define('ocelle-facts', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block} dl{${GRID}margin:0}</style><dl><slot></slot></dl>';}});
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachInternals().role='none'; this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:contents} dd{margin:0}</style><dt></dt><dd><slot></slot></dd>';} connectedCallback(){this.shadowRoot.querySelector('dt').textContent=this.getAttribute('label');}});`,
  'A5 facts manual slot assignment: shadow <dl><dt>label</dt><dd><slot (assigned fact)></dd>...; fact shadow <slot>': `
    customElements.define('ocelle-fact', class extends HTMLElement { constructor(){super(); this.attachShadow({mode:'open'}).innerHTML='<slot></slot>';}});
    customElements.define('ocelle-facts', class extends HTMLElement {
      constructor(){super(); this.attachShadow({mode:'open', slotAssignment:'manual'}).innerHTML='<style>:host{display:block} dl{${GRID}margin:0} dd{margin:0}</style><dl></dl>';}
      connectedCallback(){ this.render(); new MutationObserver(()=>this.render()).observe(this,{childList:true,subtree:true,attributes:true,attributeFilter:['label']}); }
      render(){ const dl=this.shadowRoot.querySelector('dl'); dl.replaceChildren();
        for (const f of this.querySelectorAll(':scope > ocelle-fact')) { const dt=document.createElement('dt'); dt.textContent=f.getAttribute('label'); const dd=document.createElement('dd'); const s=document.createElement('slot'); dd.append(s); dl.append(dt,dd); s.assign(f); } } });`,
};

async function measure(page) {
  return page.evaluate(() => {
    const out = [];
    const facts = document.querySelector('ocelle-facts');
    const r = (el) => { const b = el.getBoundingClientRect(); return `x=${Math.round(b.x)} w=${Math.round(b.width)} y=${Math.round(b.y)}`; };
    const terms = [];
    const collect = (root) => { for (const el of root.querySelectorAll('dt,[role=term],[role=associationlistitemkey]')) terms.push(el); for (const el of root.querySelectorAll('*')) if (el.shadowRoot) collect(el.shadowRoot); };
    collect(facts.shadowRoot); for (const f of document.querySelectorAll('ocelle-fact')) collect(f.shadowRoot);
    const defs = [];
    const collectD = (root) => { for (const el of root.querySelectorAll('dd,[role=definition],[role=associationlistitemvalue]')) defs.push(el); };
    collectD(facts.shadowRoot); for (const f of document.querySelectorAll('ocelle-fact')) collectD(f.shadowRoot);
    return { terms: terms.map(r), defs: defs.map(r) };
  });
}

(async () => {
  await withBrowser(async (browser) => {
    console.log('Chromium', browser.version());
    for (const [name, script] of Object.entries(V)) {
      const page = await browser.newPage();
      await page.setContent(`<!doctype html><html lang="en"><head><title>t</title></head><body>${CONSUMER}<script>${script}</script></body></html>`);
      await page.waitForTimeout(50);
      console.log(`\n=== ${name}`);
      console.log((await axTree(page)).split('\n').slice(4).join('\n'));
      console.log('layout', JSON.stringify(await measure(page)));
      console.log(fmtAxe(await axe(page, ['definition-list', 'dlitem', 'list', 'listitem', 'aria-allowed-role', 'aria-roles', 'aria-required-children', 'aria-required-parent'])));
      await page.close();
    }
  });
})();
