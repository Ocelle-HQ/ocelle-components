const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  console.log('version', b.version());
  await p.setContent('<button id=o>o</button><x-h></x-h>');
  const r = await p.evaluate(async () => {
    const out = {};
    out.popover = HTMLElement.prototype.hasOwnProperty('popover');
    out.anchor = CSS.supports('anchor-name: --a');
    out.startingStyle = CSS.supports('selector(:popover-open)');
    out.allowDiscrete = CSS.supports('transition-behavior: allow-discrete');
    out.closedby = 'closedBy' in HTMLDialogElement.prototype;
    out.reflect = 'ariaDescribedByElements' in Element.prototype;
    out.requestClose = 'requestClose' in HTMLDialogElement.prototype;
    // popover inside shadow root of element inside modal dialog
    customElements.define('x-h', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<dialog><button id=b>in</button><div popover=manual id=t>tip</div></dialog>'; }});
    const h = document.querySelector('x-h'); const d = h.shadowRoot.querySelector('dialog'); d.showModal();
    const t = h.shadowRoot.getElementById('t'); t.showPopover();
    out.popoverOpenOverModal = t.matches(':popover-open');
    const r = t.getBoundingClientRect(); const top = document.elementFromPoint(r.x+2, r.y+2);
    out.topHit = top === h ? 'host(shadow retargeted)' : String(top && top.tagName);
    // cancel event repeated
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
