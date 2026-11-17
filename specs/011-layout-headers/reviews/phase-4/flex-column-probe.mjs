import { chromium } from "/home/user/ocelle-components/node_modules/.pnpm/playwright@1.64.1/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ executablePath: process.env.OCELLE_CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const html = `<!doctype html><html><head><style>
.box { block-size: 600px; inline-size: 800px; outline: 1px solid red; margin-block-end: 8px }
.block { display: block } .flexcol { display: flex; flex-direction: column } .flexrow { display: flex } .grid { display: grid }
.stretch ocelle-context-sidebar { align-self: stretch }
</style></head><body>
<div id="out"></div>
<script>
const sheet = \`
:host { display: flex; flex-direction: column; min-block-size: 100%; align-self: start; box-sizing: border-box; background-color: #eee }
.layout { display: flex; flex-direction: column; flex: 1 0 auto }
.head, .footer { padding: 16px }
.sections { padding-inline: 16px; border-block-start: 1px solid; border-block-end: 1px solid }
.footer { margin-block-start: auto }
::slotted(:not([slot]):not([hidden])) { display: block !important; padding: 16px !important; margin-block: 0; margin-inline: -16px !important; border-block-start: 1px solid !important }
::slotted(:nth-child(1 of :not([slot]):not([hidden]))) { border-block-start: none !important }
\`;
customElements.define("ocelle-context-sidebar", class extends HTMLElement {
  constructor() { super(); const r = this.attachShadow({ mode: "open" });
    r.innerHTML = '<style>' + sheet + '</style><div class="layout"><div class="head"><slot name="head"></slot></div><div class="sections"><slot></slot></div><div class="footer"><slot name="footer"></slot></div></div>'; }
});
const content = '<p slot="head">Team</p><div>Overview</div><div>Members</div><div>Settings</div><p slot="footer">3 of 5</p>';
const results = [];
for (const [kind, extra] of [["block",""],["flexrow",""],["flexrow","stretch"],["grid",""],["flexcol",""],["flexcol","stretch"],["flexcol","long"]]) {
  const c = document.createElement("div"); c.className = "box " + kind + " " + extra;
  c.innerHTML = "<ocelle-context-sidebar>" + (extra === "long" ? content + "<div>" + "A long section text that keeps going ".repeat(10) + "</div>" : content) + '</ocelle-context-sidebar>';
  document.body.append(c);
  const s = c.firstElementChild.getBoundingClientRect();
  results.push({ container: kind + (extra ? " + " + extra : ""), containerInline: 800, sidebarInline: s.width, sidebarBlock: s.height });
}
window.results = results;
</script></body></html>`;
await page.setContent(html);
const r = await page.evaluate(() => window.results);
console.log(await browser.version());
console.table(r);
await browser.close();
