# Phase 5 spike: the copy request against the accessibility tree, and the deferred clipboard write (T075, research R-07)

Measured 2026-11-16 in Chromium 153.0.8010.12 (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
headless), driven by Playwright 1.64.1, before the red commit. The page is served on `http://127.0.0.1:<port>` (a
secure context) by the script below. It holds a plain model of `ocelle-copy-field` as R-07 designs it (no Lit, no
package code): an `x-copy` host whose open shadow root holds a `role="group"` wrapper with `<span part="value">`,
`<span role="status" aria-live="polite">` (the live region, holding one `Text` node the element owns and writes
imperatively, only when the text differs) and `<button part="copy-control" aria-label="Copy">`. A click on the button
(Enter and Space on the native button produce it too) sets `status` to `""`, which empties the `Text` node at once, and
then dispatches `x-copy-request` with `{ text }` at one of five timings:

- `deferred`, the R-07 design: `requestAnimationFrame(() => setTimeout(dispatch, 0))`;
- `synchronous`: in the click's task;
- `microtask`: `queueMicrotask(dispatch)`;
- `own-frame`: inside the element's own `requestAnimationFrame` callback;
- `frame-frame`: two animation frames (a control: later than the design).

## (1) `Accessibility.nodesUpdated` for the region

Before the click the region holds "Copied to clipboard". A host listener on `document` records `status` and the
region's text at the request, then sets `status = "Copied to clipboard"` again synchronously, never awaiting (R-07,
"What US4-6 observes"). The recorder enables the `Accessibility` domain, fetches the field host's node with
`getPartialAXTree` and then every descendant with `getChildAXNodes` (the region is reached this way), waits 500 ms
for Chromium to send updates as they happen, clicks the Copy control with real input, waits two frames and a task,
then 300 ms, and lists the text of every `nodesUpdated` entry of the region (role `status`), in order. Five runs per
timing, each in a fresh context.

| Timing | Updates of the region, all five runs | Listener saw (`status`, region text) |
|---|---|---|
| `deferred` (R-07) | `""`, then `"Copied to clipboard"` | `""`, `""` |
| `synchronous` | `"Copied to clipboard"` only | `""`, `""` |
| `microtask` | `"Copied to clipboard"` only | `""`, `""` |
| `own-frame` | `"Copied to clipboard"` only | `""`, `""` |
| `frame-frame` | `""`, then `"Copied to clipboard"` | `""`, `""` |

- Under the designed timing the tree records the region empty before it records the host's text again. Under
  synchronous, microtask and own-frame dispatch it records only the refilled text: the empty state never reached an
  accessibility serialisation. The listener alone cannot tell them apart (it sees `""` in every case), which is why
  R-07 observes the tree's history.
- One frame plus a task is enough; no longer wait is needed. R-07's timing stands as written.
- **A recorder detail found here, which the driver already follows.** `nodesUpdated` reports a node only once it was
  returned by `getChildAXNodes`. A node fetched only as the root of `getPartialAXTree` is not reported. A first form
  of this spike fetched the region itself as the root, and saw only its `StaticText` child's update. The driver's
  `axUpdates` (test/commands.ts `recordAxUpdates`) starts at the target and fetches its descendants with
  `getChildAXNodes`, so the field's tests start it on the field host, and the region is a reported node.
- Writing the region by `textContent` instead of `Text.data` gives the same rows (`deferred`, `synchronous`,
  `microtask` and `own-frame`, two runs each), and so does replacing the text node (`deferred` and `synchronous`, two
  runs each).

**Result.** `Accessibility.nodesUpdated` delivers the empty-region update before the refill for deferred dispatch,
and not for synchronous dispatch. T075's first stop condition does not hold. The tree-history observation runs in
every run of US4-6, both harnesses, beside the frame-order record (plan decision 7).

## (2) The clipboard write from the deferred request, with no clipboard permission granted

Every write is made by a page script, never by `page.evaluate`: Playwright's `evaluate` runs with a CDP user gesture,
which would itself activate the page. No `evaluate` runs on a page before its write has settled; the results are read
afterwards. Each case runs in a fresh browser context with no `grantPermissions` call (except the one row that says
so). Three runs, all identical.

| Case | `navigator.userActivation.isActive` at the write | `navigator.clipboard.writeText` |
|---|---|---|
| Control 1: a write 200 ms after load, no click | `false` | rejected, `NotAllowedError` |
| Control 2: a write synchronously in a real click's handler | `true` | resolved |
| The deferred request after a real click on the Copy control | `true` | resolved |
| The deferred request after Enter on the focused Copy control | `true` | resolved |
| The deferred request after Space on the focused Copy control | `true` | resolved |
| For the record: control 1 with `clipboard-write` granted to the context | `false` | rejected, `NotAllowedError` |
| For the record: a write 6 s after the deferred request | `false` | rejected, `NotAllowedError` |

- Both controls hold: the gate is on (a write with no activation rejects) and the setup can succeed (a write in the
  click's handler resolves). So the deferred request's result is an answer, not an artefact.
- In Chromium the request arrives while the click's transient activation is still active, and a write from it
  resolves, for click, Enter and Space alike. The activation window then closes (the 6 s row).
- `navigator.permissions.query({ name: "clipboard-write" })` reports `granted` in every case, with no grant made.
  That is Chromium's default state for this permission, not a grant that lifts the activation gate: control 1 still
  rejects. An explicit grant does not lift it in this build either (the "granted" row). PLAN-FRESH-3-004's concern, a
  grant that replaces the activation requirement, does not reproduce in Chromium 153 headless; the spike makes no
  grant in any case it counts.

**Result.** The controls hold, so the spike answers the Chromium question: a clipboard write from the deferred
request still counts as user-activated in Chromium (`isActive` true, the write resolves). T075's second stop condition
does not hold.

## What stays open

The WebKit question is not answered here and cannot be (no WebKit in this repository's runs). Does a clipboard write
from the deferred request still count as user-activated in WKWebView and WebKitGTK? It stays open, with the console
and kitty-mission-ui owners, as R-07 and plan decision 1 record. A desktop bridge is not affected. The README's
FR-035 paragraph tells hosts that write the clipboard from the page to check their engines' user-activation rules.
No implementation choice of this phase depends on the answer: R-07 keeps the deferred dispatch (operator decision
PLAN-FRESH-2-004 (a)).

## The spike script

Run with `node spike.mjs` and `OCELLE_CHROMIUM_PATH` set; it imports the repository's Playwright by absolute path.
Optional environment: `MODES` and `RUNS` select the timings and the number of runs of part (1). `WRITE`
(`data`, the default, `textContent` or `replace`) selects how the region is written. `ONLY_AX` stops after part (1),
and `RAW` prints every raw `nodesUpdated` entry. The tables above are from one run with the defaults.

```js
import { createServer } from "node:http";
import { chromium } from "/home/user/ocelle-components/node_modules/playwright/index.mjs";

// The page: a plain model of ocelle-copy-field as R-07 designs it (no Lit, no package code), and the clipboard controls.
const page = `<!doctype html><html><head><meta charset="utf-8"><title>spike</title><script src="/spike.js"></script></head>
<body><button id="before">before</button><x-copy id="f" value="pnpm run manifest"></x-copy><button id="plain">plain</button></body></html>`;
const script = `window.WRITE = "${process.env.WRITE ?? "data"}";

window.__clip = { log: [] };
const record = (where, write) => {
  const entry = { where, active: navigator.userActivation.isActive, been: navigator.userActivation.hasBeenActive };
  write().then(() => { entry.result = "resolved"; }, (e) => { entry.result = "rejected " + e.name; });
  window.__clip.log.push(entry);
};
navigator.permissions.query({ name: "clipboard-write" }).then((s) => { window.__clip.permission = s.state; }, (e) => { window.__clip.permission = "query failed " + e.name; });
addEventListener("load", () => {
  window.__clip.atLoad = navigator.userActivation.isActive;
  const scenario = location.search.slice(1);
  if (scenario === "no-click") setTimeout(() => record("no click", () => navigator.clipboard.writeText("no click")), 200);
  if (scenario === "in-click") document.getElementById("plain").addEventListener("click", () => record("in the click handler", () => navigator.clipboard.writeText("in the click")));
  if (scenario === "late") document.addEventListener("x-copy-request", (event) => setTimeout(() => record("6 s after the deferred request", () => navigator.clipboard.writeText(event.detail.text)), 6000));
  if (scenario.startsWith("deferred")) document.addEventListener("x-copy-request", (event) => record("in the deferred request", () => navigator.clipboard.writeText(event.detail.text)));
});
customElements.define("x-copy", class extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = '<div role="group"><span part="value"></span><span role="status" aria-live="polite" class="status"></span><button part="copy-control" aria-label="Copy">Copy</button></div>';
    this.text = document.createTextNode("");
    root.querySelector(".status").append(this.text);
    root.querySelector("[part=value]").textContent = this.getAttribute("value");
    this._status = "";
    this.mode = "deferred";
    root.querySelector("button").addEventListener("click", () => this.activate());
  }
  get status() { return this._status; }
  set status(value) { this._status = value; const region = this.shadowRoot.querySelector(".status"); if (window.WRITE === "textContent") { if (region.textContent !== value) region.textContent = value; } else if (window.WRITE === "replace") { if (region.textContent !== value) { this.text = document.createTextNode(value); region.replaceChildren(this.text); } } else if (this.text.data !== value) this.text.data = value; }
  activate() {
    this.status = "";
    const text = this.getAttribute("value");
    const send = () => { if (this.isConnected) this.dispatchEvent(new CustomEvent("x-copy-request", { bubbles: true, composed: true, detail: { text } })); };
    if (this.mode === "synchronous") send();
    else if (this.mode === "microtask") queueMicrotask(send);
    else if (this.mode === "own-frame") requestAnimationFrame(send);
    else if (this.mode === "frame-frame") requestAnimationFrame(() => requestAnimationFrame(send));
    else requestAnimationFrame(() => setTimeout(send, 0));
  }
});
`;
const server = createServer((req, res) => {
  if (req.url === "/spike.js") { res.writeHead(200, { "content-type": "text/javascript" }); res.end(script); return; }
  res.writeHead(200, { "content-type": "text/html" }); res.end(page);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.OCELLE_CHROMIUM_PATH });
console.log("chromium", browser.version());

const text = (v) => (typeof v === "string" ? v : "");
async function recordRegion(session) {
  await session.send("Accessibility.enable");
  const { root } = await session.send("DOM.getDocument", { depth: -1, pierce: true });
  const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector: "#f" });
  const { node } = await session.send("DOM.describeNode", { nodeId, depth: -1, pierce: true });
  let region;
  const find = (n) => { if (n.attributes?.includes("status") && n.localName === "span") region = n; for (const c of [...(n.children ?? []), ...(n.shadowRoots ?? [])]) find(c); };
  find(node);
  const known = new Set();
  const children = async (id) => { const { nodes } = await session.send("Accessibility.getChildAXNodes", { id }); for (const n of nodes) known.add(n.nodeId); return nodes; };
  const textOf = async (n) => { let f = ""; for (const c of n.childIds?.length === 0 ? [] : await children(n.nodeId)) { if (text(c.role?.value) === "StaticText") f += text(c.name?.value); else if (text(c.role?.value) !== "InlineTextBox") f += await textOf(c); } return f; };
  const { nodes } = await session.send("Accessibility.getPartialAXTree", { backendNodeId: node.backendNodeId, fetchRelatives: false });
  for (const n of nodes) { known.add(n.nodeId); await textOf(n); }
  const updates = [];
  let queue = Promise.resolve();
  const listener = ({ nodes }) => { if (process.env.RAW) console.log("raw", JSON.stringify(nodes.map((n) => [n.nodeId, n.role?.value, n.name?.value, known.has(n.nodeId)]))); for (const n of nodes.filter((e) => known.has(e.nodeId))) queue = queue.then(async () => { if (text(n.role?.value) === "status") updates.push({ role: text(n.role?.value), text: await textOf(n) }); }); };
  session.on("Accessibility.nodesUpdated", listener);
  await new Promise((r) => setTimeout(r, 500));
  return async () => { await new Promise((r) => setTimeout(r, 300)); session.off("Accessibility.nodesUpdated", listener); await queue; return updates; };
}

// (1) nodesUpdated under each dispatch timing, with a host listener setting the same text synchronously.
for (const mode of (process.env.MODES ?? "deferred,synchronous,microtask,own-frame,frame-frame").split(",")) {
  for (let run = 0; run < Number(process.env.RUNS ?? 5); run++) {
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto(origin + "/");
    await p.evaluate((mode) => {
      const f = document.getElementById("f");
      f.mode = mode;
      f.status = "Copied to clipboard";
      window.__log = [];
      document.addEventListener("x-copy-request", () => { window.__log.push(["request", f.status, f.shadowRoot.querySelector(".status").textContent]); f.status = "Copied to clipboard"; });
    }, mode);
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const session = await context.newCDPSession(p);
    const stop = await recordRegion(session);
    await p.click("#f >> [part=copy-control]");
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))));
    const updates = await stop();
    const log = await p.evaluate(() => window.__log);
    console.log(`axUpdates ${mode} #${run}: ${JSON.stringify(updates.map((u) => u.text))} log ${JSON.stringify(log)}`);
    await context.close();
  }
}

if (process.env.ONLY_AX) { await browser.close(); server.close(); process.exit(0); }
// (2) clipboard controls and the deferred write, no permission granted to the context. Every write is made from a
// page script: Playwright's evaluate runs with a user gesture (CDP userGesture), which would itself activate the page,
// so no evaluate runs on a page before its write has settled; results are read afterwards.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let run = 0; run < 3; run++) {
  const results = {};
  for (const scenario of ["no-click", "in-click", "deferred", "deferred-enter", "deferred-space", "granted-no-click", "late"]) {
    const context = await browser.newContext();
    if (scenario === "granted-no-click") await context.grantPermissions(["clipboard-write"], { origin });
    const p = await context.newPage();
    await p.goto(origin + "/?" + scenario.replace("granted-", ""));
    await wait(400);
    if (scenario === "in-click") await p.click("#plain");
    if (scenario === "deferred" || scenario === "late") await p.click("#f >> [part=copy-control]");
    if (scenario === "deferred-enter" || scenario === "deferred-space") { await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.keyboard.press(scenario === "deferred-enter" ? "Enter" : " "); }
    await wait(scenario === "late" ? 6600 : 600);
    results[scenario] = await p.evaluate(() => window.__clip);
    await context.close();
  }
  console.log(`clipboard #${run}: ${JSON.stringify(results)}`);
}
await browser.close();
server.close();
```
