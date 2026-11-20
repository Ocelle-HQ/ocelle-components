# Phase 6 spikes: the link on a `file:` document, and the link host with a host `aria-label` (T090; research R-08, R-09)

Measured 2026-11-16 in Chromium 153.0.8010.12 (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
headless), driven by Playwright 1.64.1, with axe-core 4.14.0, before any scaffold, red or green work. The scripts are at
the end. Each page holds a plain model of `ocelle-link` as R-08 designs it (no Lit, no package code): an `x-link` host
whose open shadow root (`delegatesFocus`) holds `<a part="anchor">` around a default slot, with the host's `href` on
the anchor, or without one `role="link"` and `tabindex="0"`.

## (1) R-09: the `file:` fixture

A copy of the fixture opened from a `file:` URL, with the fixture's policy in a `<meta http-equiv="Content-Security-Policy">`
(`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`), loads the browser build
(`dist/browser/ocelle-elements.js` as built at `493142e`) and a model link module, both as same-directory module
scripts. A `link-target.html` with the same `<meta>` policy sits beside it. The test sets a `window` marker and
clicks the model link (`href="link-target.html"`), whose click handler resolves the `href` against `document.baseURI`
and calls `location.assign` when the resolved protocol is `http:`, `https:` or the document's own.

| Launch | Scripts | After the click |
|---|---|---|
| no flag (control) | blocked: "Access to script at 'file:///…/ocelle-elements.js' from origin 'null' has been blocked by CORS policy", the same for the model module; nothing defined | no navigation (the model link is not defined) |
| `--allow-file-access-from-files` | both load, `ocelle-copy-field`, `ocelle-listbox` and the model link are defined; no CSP violation (the `<meta>` policy's `'self'` admits the `file:` scripts); no console message | the page is `file:///…/link-target.html`, the marker is gone, the target page's own text is present; no CSP violation |

The resolved protocol was `file:`, equal to `location.protocol` (`file:`), and `location.origin` read `file://`.

**Result.** The stop condition of R-09 and plan decision 6 does not hold: the `file:` page loads the browser build and
navigates under `--allow-file-access-from-files`. The `elements-browser-file` project (phase 1, T008) stays as
planned, and US5-12 runs in it.

## (2) R-08: the link host with a host `aria-label`

The paragraph is `<p>See <x-link href="t.html" aria-label="the mission log, opens in the viewer">the mission log</x-link>
for details.</p>` (a label that starts with the visible text, R-08 "Label in name"), the same without `href`, and the same
without the host `aria-label` (for comparison). The tree is the unignored subtree of the paragraph in Chromium's full
accessibility tree (inline text boxes left out); "focused" is the node Chromium marks `focused` after one real Tab from
the page start (`document.activeElement` was the host, its shadow root's active element the anchor, in every form).
US5-8 and R-08 require exactly one named node for the link: the link itself, named by the host `aria-label`.

| Form (host / anchor) | With `href` and a host `aria-label`: named nodes | Focused node |
|---|---|---|
| No host role, label forwarded to the anchor (the R-08 design; R-08's plant "the plain forward") | **two**: generic "the mission log, opens in the viewer" (the host) → link "the mission log, opens in the viewer" | the link |
| No host role, label not forwarded | **two**: generic "the mission log, opens in the viewer" → link "the mission log" | the link, named by its text |
| Internals role `none` on the host, label forwarded | **two**, as the R-08 design (Chromium ignores `none` on an element with a global ARIA attribute) | the link |
| Internals role `presentation` on the host, label forwarded | **two**, as with `none` | the link |
| `:host { display: contents }`, label forwarded; also with internals role `none` | **two**, as the R-08 design | the link |
| Internals role `generic` or `group` on the host, label forwarded | **two**: generic (or group) "the mission log, opens in the viewer" → link of the same name | the link |
| Internals role `link` on the host (R-08's first candidate), anchor with `href` | **two links**: link "the mission log, opens in the viewer" (the host) → link "the mission log" (the anchor); the same with the label forwarded too, or with the host named through `internals.ariaLabel` | the inner link |
| Internals role `link` on the host, anchor `role="none"` or `"presentation"` | with `href`: two links, as above (a focusable anchor keeps its role); without `href`: link (host) → focusable generic | with `href` the inner link; without `href` a **generic** "the mission log" |
| Internals role `link` on the host, anchor `role="generic"` (R-08's "a form that keeps the name off" the focus target) | **one**: link "the mission log, opens in the viewer" (the host) → generic (the anchor, focusable) | a **generic** "the mission log", not a link; axe-core 4.14.0 (the gate's rule set) reports `aria-roles`, critical |
| The element copies the host's `aria-label` to the anchor and **removes** it from the host | **one**: generic "" → link "the mission log, opens in the viewer" | the link |

Without `href` every form gives the same named nodes as with it, except where the row says so. Without a host
`aria-label` the R-08 design has exactly one named node: generic "" → link "the mission log", focused.

axe-core 4.14.0 with the `axe` gate's rule set (every default rule and every rule tagged `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa` or `wcag22aa`, less the experimental and harness-document rules), on the paragraph inside a
`<main>`: the R-08 design (two named nodes) has no violation and no incomplete; the removing form has none; the
host-`link`/anchor-`generic` form has `aria-roles` (critical, 1 node).

**Result: the stop condition of T090 (R-08, plan decision 7) holds.** Chromium names a role-less link host from its
`aria-label`, as it named the tabs host in phase 3 (`reviews/phase-3/spike.md` (2)). With the host's attribute left in
place, no measured form gives exactly one named node that is the focused link: `none`, `presentation`,
`display: contents`, `generic` and `group` all keep the named host node; an internals `link` role on the host gives
two links, or, with the anchor's role suppressed, one named link whose focus target is a generic (the user's focus
lands on a node that is not a link, and axe reports a critical `aria-roles`). The one form with exactly one named node
that is also the focused link removes the host's `aria-label`, against mission 005's rule that an element never writes
its host's attributes. Phase 6 stops here for the operator's decision (tasks.md "Stop-and-ask points", T090 spikes;
plan.md decision 7; research R-08: "If no form gives one named node, the phase stops and the operator decides"). No
scaffold, red or green work has been done.

## Open question for the operator (stop-and-ask, T090)

With a host `aria-label`, how should `ocelle-link` be named and exposed? These are the options the spike supports.

- **(a)** The element moves a host `aria-label` to the anchor: it copies the value and removes the host's attribute,
  observing it, so a later host write is moved again. One named node, the focused link (measured). Cost: an exception
  to mission 005's "the element never writes its host's attributes"; a framework that re-renders the attribute sees it
  removed, and `getAttribute("aria-label")` on the host then reads `null`. This is the option declined for the tabs.
- **(b)** The R-08 design as it is, accepting two named nodes: the host as a named generic around the link of the same
  name. axe-core 4.14.0 reports nothing on it (measured). US5-8 ("exactly one named node"), R-08, contracts § Pairings
  and plan decision 7 would be amended. A screen reader may read the name twice in browse mode. Declined for the tabs.
- **(c)** As the tabs (operator decision during phase 3): `ocelle-link` is named by its text, or by a new `label`
  attribute and property (not reflected, trimmed, blank counts as none) that the element sets as the anchor's
  `aria-label`; a host `aria-label` is not forwarded or observed, the element writes no host attribute, and the README
  tells hosts to use `label`, which must contain the visible text (R-08 "Label in name"). One named node, the focused
  link. Needs a spec amendment (FR-045, US5-8; a new attribute in contracts § `ocelle-link` and the manifest) and the
  constitution III exception extended to the link in plan.md Complexity Tracking.
- **(d)** `ocelle-link` is named by its text only, with no `label` surface; a host `aria-label` is not forwarded, and
  the README tells hosts not to set one (it would name a generic around the link). One named node. Smallest surface,
  but a host can no longer give a name that extends the visible text (US5-8's case). Needs the same spec amendments,
  without the new attribute.

**Recommendation: (c).** It keeps US5-8's purpose (a name that starts with the visible text and extends it), gives
exactly one named node that is the focused link, keeps mission 005's host-attribute rule, and is the rule the operator
already chose for `ocelle-tabs`, so hosts learn one naming rule for the two elements that cannot forward a host
`aria-label`. The story test's `label-content-name-mismatch` check (T095) and its plant apply to `label` unchanged.

## The spike scripts

Run from a scratch directory with `node <script>` and `OCELLE_CHROMIUM_PATH` set; they import the repository's
Playwright and axe-core by absolute path.

### `spike-file.mjs` (R-09), with `filefix/` holding `ocelle-elements.js`, `model-link.js`, `link.html` and `link-target.html`

```js
import { chromium } from "<repository root>/node_modules/playwright/index.mjs";
import { pathToFileURL } from "node:url";
const dir = new URL("./filefix/", pathToFileURL(process.cwd() + "/"));
for (const args of [[], ["--allow-file-access-from-files"]]) {
  const browser = await chromium.launch({ executablePath: process.env.OCELLE_CHROMIUM_PATH, args });
  const page = await (await browser.newContext()).newPage();
  const log = [];
  page.on("console", (m) => log.push(`console.${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => log.push(`error: ${e.message}`));
  page.on("requestfailed", (r) => log.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
  await page.addInitScript(() => { window.__v = []; document.addEventListener("securitypolicyviolation", (e) => window.__v.push(e.violatedDirective + " " + e.blockedURI)); });
  await page.goto(new URL("link.html", dir).href, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => ({ url: location.href, protocol: location.protocol, origin: location.origin, defined: ["ocelle-copy-field", "ocelle-listbox", "x-link"].map((t) => customElements.get(t) !== undefined), violations: window.__v }));
  await page.evaluate(() => { window.__marker = true; });
  let after;
  try {
    await page.click("#l", { timeout: 3000 });
    await page.waitForLoadState("load");
    await page.waitForTimeout(300);
    after = await page.evaluate(() => ({ url: location.href, marker: window.__marker === true, target: document.getElementById("target")?.textContent ?? null, violations: window.__v }));
  } catch (e) { after = String(e).split("\n")[0]; }
  console.log(JSON.stringify({ args, before, after, log }, null, 1));
  await browser.close();
}
```

`filefix/model-link.js`:

```js
// A plain model of R-08's activation on the anchor: plain click intercepted, location.assign of the resolved target
// when its protocol is http:, https: or the document's own.
customElements.define("x-link", class extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    const a = document.createElement("a");
    a.setAttribute("href", this.getAttribute("href") ?? "");
    a.append(document.createElement("slot"));
    root.append(a);
    a.addEventListener("click", (event) => {
      event.preventDefault();
      const url = new URL(this.getAttribute("href"), document.baseURI);
      window.__decided = { resolved: url.href, protocol: url.protocol, documentProtocol: location.protocol };
      if (["http:", "https:", location.protocol].includes(url.protocol)) location.assign(url.href);
    });
  }
});
```

`filefix/link.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'">
<title>link on file</title>
<script type="module" src="ocelle-elements.js"></script>
<script type="module" src="model-link.js"></script>
</head>
<body><p>See <x-link id="l" href="link-target.html">the target</x-link>.</p></body>
</html>
```

### `spike-ax.mjs` (R-08, the tree)

```js
// T090 (2): the link host with a host aria-label, forms of exposure; read the unignored AX subtree of the paragraph.
import { chromium } from "<repository root>/node_modules/playwright/index.mjs";
import { createServer } from "node:http";

const label = "the mission log, opens in the viewer";
const forms = {
  // plain forward: host role-less, anchor gets aria-label (R-08's "plain forward" plant)
  "forward": { hostRole: null, anchorLabel: true },
  "no-forward": { hostRole: null, anchorLabel: false },
  "host-none-forward": { hostRole: "none", anchorLabel: true },
  "host-presentation-forward": { hostRole: "presentation", anchorLabel: true },
  "contents-forward": { hostRole: null, anchorLabel: true, contents: true },
  "contents-none-forward": { hostRole: "none", anchorLabel: true, contents: true },
  "host-link-anchor-href": { hostRole: "link", anchorLabel: false },
  "host-link-anchor-href-forward": { hostRole: "link", anchorLabel: true },
  "host-link-anchor-none": { hostRole: "link", anchorLabel: false, anchorRole: "none" },
  "host-link-anchor-presentation": { hostRole: "link", anchorLabel: false, anchorRole: "presentation" },
  "host-link-anchor-generic": { hostRole: "link", anchorLabel: false, anchorRole: "generic" },
  "host-link-internals-label": { hostRole: "link", anchorLabel: false, internalsLabel: true },
  "host-generic-forward": { hostRole: "generic", anchorLabel: true },
  "host-group-forward": { hostRole: "group", anchorLabel: true },
  "remove-host-label": { hostRole: null, anchorLabel: true, remove: true },
};
const script = `
const forms = ${JSON.stringify(forms)};
const form = forms[new URL(location.href).searchParams.get("form")];
customElements.define("x-link", class extends HTMLElement {
  static observedAttributes = ["aria-label", "href"];
  constructor() {
    super();
    this.internals = this.attachInternals();
    if (form.hostRole) this.internals.role = form.hostRole;
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    if (form.contents) { const s = new CSSStyleSheet(); s.replaceSync(":host { display: contents }"); root.adoptedStyleSheets = [s]; }
    this.anchor = document.createElement("a");
    this.anchor.setAttribute("part", "anchor");
    if (form.anchorRole) this.anchor.setAttribute("role", form.anchorRole);
    this.anchor.append(document.createElement("slot"));
    root.append(this.anchor);
  }
  attributeChangedCallback() {
    const href = this.getAttribute("href");
    if (href === null) { this.anchor.removeAttribute("href"); if (!form.anchorRole) this.anchor.setAttribute("role", "link"); this.anchor.setAttribute("tabindex", "0"); }
    else { this.anchor.setAttribute("href", href); }
    const label = this.getAttribute("aria-label");
    if (form.anchorLabel && label !== null) this.anchor.setAttribute("aria-label", label);
    if (form.internalsLabel && label !== null) this.internals.ariaLabel = label;
    if (form.remove && label !== null) this.removeAttribute("aria-label");
  }
  connectedCallback() { this.attributeChangedCallback(); }
});
`;
const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><title>spike</title><script src="/x.js"></script></head><body>${body}</body></html>`;
const bodies = {
  href: `<p id="p">See <x-link id="l" href="t.html" aria-label="${label}">the mission log</x-link> for details.</p>`,
  nohref: `<p id="p">See <x-link id="l" aria-label="${label}">the mission log</x-link> for details.</p>`,
  plain: `<p id="p">See <x-link id="l" href="t.html">the mission log</x-link> for details.</p>`,
};
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/x.js") { res.writeHead(200, { "content-type": "text/javascript" }); res.end(script); return; }
  res.writeHead(200, { "content-type": "text/html" }); res.end(page(bodies[url.searchParams.get("body")] ?? ""));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.OCELLE_CHROMIUM_PATH });
console.log("chromium", browser.version());
for (const name of Object.keys(forms)) {
  for (const body of Object.keys(bodies)) {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto(`${origin}/?form=${name}&body=${body}`);
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const cdp = await context.newCDPSession(p);
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const para = nodes.find((n) => n.role?.value === "paragraph");
    const out = [];
    const walk = (n, depth) => {
      if (!n.ignored) out.push(`${"  ".repeat(depth)}${n.role?.value} "${n.name?.value ?? ""}"${(n.properties ?? []).some((pp) => pp.name === "focusable" && pp.value.value) ? " [focusable]" : ""}`);
      for (const c of n.childIds ?? []) { const ch = byId.get(c); if (ch && ch.role?.value !== "InlineTextBox") walk(ch, n.ignored ? depth : depth + 1); }
    };
    if (para) walk(para, 0);
    await p.keyboard.press("Tab");
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const focusRole = await (async () => { const { nodes: f } = await cdp.send("Accessibility.getFullAXTree"); const fn = f.filter((n) => (n.properties ?? []).some((pp) => pp.name === "focused" && pp.value.value)); return fn.length ? fn.map((x) => `${x.role?.value} "${x.name?.value ?? ""}"`).join(" | ") : "none"; })();
    const active = await p.evaluate(() => { const a = document.activeElement; return `${a?.localName}${a?.shadowRoot?.activeElement ? " > " + a.shadowRoot.activeElement.localName : ""}`; });
    const hostLabel = await p.evaluate(() => document.getElementById("l").getAttribute("aria-label"));
    console.log(`== ${name} / ${body}\n${out.join("\n")}\n  focused AX: ${focusRole} (activeElement ${active}); host aria-label attr: ${JSON.stringify(hostLabel)}`);
    await context.close();
  }
}
await browser.close();
server.close();
```

### `spike-axe.mjs` (R-08, axe-core on three forms)

```js
// axe-core 4.14.0 (the gate's pinned version, default + WCAG 2.x A/AA tags, experimental and harness-document rules off)
// on the forwarding forms of the link host with a host aria-label.
import { chromium } from "<repository root>/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
const axe = readFileSync("<repository root>/node_modules/axe-core/axe.min.js", "utf8");
const forms = {
  forward: { hostRole: null, remove: false },
  "remove-host-label": { hostRole: null, remove: true },
  "host-link-anchor-generic": { hostRole: "link", anchorRole: "generic", noForward: true },
};
const browser = await chromium.launch({ executablePath: process.env.OCELLE_CHROMIUM_PATH });
for (const [name, form] of Object.entries(forms)) {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>See <x-link id="l" href="#t" aria-label="the mission log, opens in the viewer">the mission log</x-link> for details.</p></main></body></html>`);
  await page.evaluate((form) => {
    customElements.define("x-link", class extends HTMLElement {
      constructor() { super(); const i = this.attachInternals(); if (form.hostRole) i.role = form.hostRole; const r = this.attachShadow({ mode: "open", delegatesFocus: true }); const a = document.createElement("a"); a.href = "#t"; if (form.anchorRole) a.setAttribute("role", form.anchorRole); a.append(document.createElement("slot")); r.append(a); if (!form.noForward) a.setAttribute("aria-label", this.getAttribute("aria-label")); if (form.remove) this.removeAttribute("aria-label"); }
    });
  }, form);
  await page.addScriptTag({ content: axe });
  const result = await page.evaluate(async () => {
    const meta = window.axe.getRules();
    const all = window.axe._audit.rules;
    const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
    const harness = ["bypass", "document-title", "html-has-lang", "html-lang-valid", "html-xml-lang-mismatch", "landmark-one-main", "page-has-heading-one", "region"];
    const rules = Object.fromEntries(all.map((r) => [r.id, { enabled: (r.enabled || r.tags.some((t) => wcag.includes(t))) && !r.tags.includes("experimental") && !harness.includes(r.id) }]));
    const res = await window.axe.run(document, { rules, resultTypes: ["violations", "incomplete"] });
    return { violations: res.violations.map((v) => `${v.id} (${v.impact}) ${v.nodes.length}`), incomplete: res.incomplete.map((v) => `${v.id} (${v.impact})`) };
  });
  console.log(name, JSON.stringify(result));
  await page.close();
}
await browser.close();
```
