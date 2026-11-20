# Phase 2 spike: the focus record's order in Chromium (T010, research R-03)

Measured 2026-11-14 in Chromium 153.0.8010.12 (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`),
driven by Playwright 1.64.1 with real input (`page.keyboard.press("Tab")`, `page.click`, `page.mouse.click`). The page
is a plain model of the parent: `#host` (a `div`) holds three focusable children `a`, `b` (tab stop) and `c`, with
`#before` and `#after` buttons around it and a plain paragraph below. On `#host`: a `MutationObserver` (`childList`),
a capture-phase `focusout` listener that logs `target`, `relatedTarget`, `isConnected`, `parentNode === host` and
`document.activeElement`, and that, when `relatedTarget` is `null`, queues a microtask at once which calls the
observer's `takeRecords()` and logs the removed and added nodes (the focus record of R-03). A second, bubble-phase
`focusout` listener on `#host` plays the host page that re-renders on blur: it moves (`appendChild`) or removes the
blurred child in a microtask or in a `requestAnimationFrame`. Each child logs its `blur`.

## (a) Script removal and script move of the focused child

| Case | Recorded order |
|---|---|
| `b.remove()`, then the script queues a microtask | `blur b` (connected) → `focusout` on the host, `relatedTarget` null, target connected and still the host's child, `activeElement` body → `remove()` returns → **focusout microtask: `takeRecords()` lists `b` in `removedNodes`** → the script's microtask → focus stays on the body |
| `host.insertBefore(b, null)` (a move), then the script queues a microtask | `blur b` → `focusout`, `relatedTarget` null, connected, child of the host, `activeElement` body → `insertBefore` returns → **focusout microtask: removed `[b]`, added `[b]`** → the script's microtask |
| `b.remove(); host.insertBefore(b, next)` (re-insert in place) | `blur b` → `focusout`, `relatedTarget` null → returns → **focusout microtask: removed `[b]`, added `[b]`** |

The blur and `focusout` run inside the `remove()` / `insertBefore()` call, so the microtask the `focusout` handler
queues is queued before any microtask the script queues after the call, runs first, and its `takeRecords()` holds the
removal record that caused the blur. The observer's own callback then has nothing left for that record.

## (b) User Tab and user click out, the host moving or removing the child afterwards

| Input | Host step | `focusout` `relatedTarget` | Focus record | Final `activeElement` |
|---|---|---|---|---|
| Tab | move in a microtask | `#after` | nothing recorded (non-null) | `#after` |
| click on `#after` | move in a microtask | `#after` | nothing recorded | `#after` |
| Tab | move in a `requestAnimationFrame` | `#after` | nothing recorded | `#after` |
| click on `#after` | move in a `requestAnimationFrame` | `#after` | nothing recorded | `#after` |
| Tab | remove in a microtask | `#after` | nothing recorded | `#after` |
| click on `#after` | remove in a microtask | `#after` | nothing recorded | `#after` |
| Tab | remove in a `requestAnimationFrame` | `#after` | nothing recorded | `#after` |
| click on `#after` | remove in a `requestAnimationFrame` | `#after` | nothing recorded | `#after` |
| click on plain paragraph text (no focusable) | move in a later task | `null` | the microtask's `takeRecords()` lists nothing, so the record is cleared there | body |

In the microtask cases the host's step runs while `activeElement` is still the body (focus has not reached `#after`
yet), and in the frame cases after it has: in both, the `relatedTarget` of the user's `focusout` is the element focus
goes to, so the record keeps nothing and nothing refocuses the child. For the click on non-focusable text the
`relatedTarget` is `null`, and the record's microtask runs before the host's later step and finds no record of the
child, so the record is cleared and the host's later move does not steal focus back.

## Result

No contradiction with R-03: the blur of a removal or move is found by `takeRecords()` in the `focusout` microtask,
and a user Tab or a click on a focusable element has a non-null `relatedTarget`. The stop-and-ask condition of
tasks.md (T010) does not hold; the design of R-03 stands as written.

## The spike script

Run with `node spike.mjs` and `OCELLE_CHROMIUM_PATH` set; it imports the repository's Playwright by absolute path.

```js
import { chromium } from "<repository root>/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ executablePath: process.env.OCELLE_CHROMIUM_PATH });
const page = await browser.newPage();
console.log("version", browser.version());
await page.setContent(`<button id="before">before</button><div id="host"><div id="a" tabindex="-1">a</div><div id="b" tabindex="0">b</div><div id="c" tabindex="-1">c</div></div><button id="after">after</button><p id="plain">plain text</p>`);
await page.evaluate(() => {
  const host = document.getElementById("host");
  window.__kids = Object.fromEntries(["a","b","c"].map((id) => [id, document.getElementById(id)]));
  const log = [];
  window.__log = log;
  const name = (n) => (n === null ? null : n.id || n.localName);
  const observer = new MutationObserver((records) => {
    log.push(`observer callback: ${records.map((r) => `${[...r.removedNodes].map(name)}-/+${[...r.addedNodes].map(name)}`).join(",")}`);
  });
  window.__observer = observer;
  observer.observe(host, { childList: true });
  for (const id of ["a", "b", "c"]) window.__kids[id].addEventListener("blur", () => log.push(`blur ${id} connected=${window.__kids[id].isConnected}`));
  host.addEventListener("focusout", (event) => {
    log.push(`focusout(capture on host) target=${name(event.target)} related=${name(event.relatedTarget)} connected=${event.target.isConnected} parentIsHost=${event.target.parentNode === host} active=${name(document.activeElement)}`);
    if (event.relatedTarget === null) {
      queueMicrotask(() => {
        const records = observer.takeRecords();
        log.push(`focusout microtask: takeRecords removed=[${records.flatMap((r) => [...r.removedNodes].map(name))}] added=[${records.flatMap((r) => [...r.addedNodes].map(name))}] active=${name(document.activeElement)}`);
      });
    }
  }, { capture: true });
  host.addEventListener("focusin", (event) => log.push(`focusin target=${name(event.target)} related=${name(event.relatedTarget)}`), { capture: true });
  window.__hostMode = null;
  // the host's own re-render on blur (a listener on the host, bubble phase)
  host.addEventListener("focusout", (event) => {
    const mode = window.__hostMode;
    if (mode === null) return;
    const child = event.target;
    const act = () => {
      log.push(`host ${mode.what} in ${mode.when} start active=${name(document.activeElement)}`);
      if (mode.what === "move") host.appendChild(child); else child.remove();
      log.push(`host ${mode.what} in ${mode.when} end active=${name(document.activeElement)}`);
    };
    if (mode.when === "microtask") queueMicrotask(act); else requestAnimationFrame(act);
  });
});
const run = async (label, setup, action) => {
  await page.evaluate(() => { window.__log.length = 0; window.__hostMode = null; window.__observer.takeRecords(); });
  await page.evaluate(() => {
    const host = document.getElementById("host");
    for (const id of ["a", "b", "c"]) { host.appendChild(window.__kids[id]); }
    window.__observer.takeRecords();
  });
  await page.evaluate(setup ?? (() => {}));
  await page.evaluate(() => { window.__log.length = 0; });
  await action();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))));
  const log = await page.evaluate(() => [...window.__log, `final active=${document.activeElement?.id || document.activeElement?.localName}`]);
  console.log(`\n### ${label}`); for (const line of log) console.log("  " + line);
};
const focusB = () => page.evaluate(() => window.__kids.b.focus());
await run("(a1) script removal of the focused child, then a host microtask queued after the call", null, async () => {
  await focusB();
  await page.evaluate(() => { window.__log.length = 0; const b = document.getElementById("b"); window.__log.push("remove() start"); b.remove(); window.__log.push("remove() returned"); queueMicrotask(() => window.__log.push("script microtask after remove")); });
});
await run("(a2) script move of the focused child (insertBefore(b, null))", null, async () => {
  await focusB();
  await page.evaluate(() => { window.__log.length = 0; const b = document.getElementById("b"); const h = document.getElementById("host"); window.__log.push("insertBefore start"); h.insertBefore(b, null); window.__log.push("insertBefore returned"); queueMicrotask(() => window.__log.push("script microtask after move")); });
});
await run("(a3) script re-insert in place of the focused child", null, async () => {
  await focusB();
  await page.evaluate(() => { window.__log.length = 0; const b = document.getElementById("b"); const h = document.getElementById("host"); const n = b.nextSibling; b.remove(); h.insertBefore(b, n); window.__log.push("reinsert returned"); });
});
for (const what of ["move", "remove"]) for (const when of ["microtask", "raf"]) {
  await run(`(b) user Tab out, host ${what} in a ${when}`, null, async () => {
    await focusB(); await page.evaluate(({ what, when }) => { window.__log.length = 0; window.__hostMode = { what, when }; }, { what, when });
    await page.keyboard.press("Tab");
  });
  await run(`(b) user click on the outside button, host ${what} in a ${when}`, null, async () => {
    await focusB(); await page.evaluate(({ what, when }) => { window.__log.length = 0; window.__hostMode = { what, when }; }, { what, when });
    await page.click("#after");
  });
}
await run("(b') user click on plain page text (no focusable), then the host moves the child in a later task", null, async () => {
  await focusB();
  await page.mouse.click(400, (await page.locator("#plain").boundingBox()).y + 5);
  await page.evaluate(() => new Promise((r) => setTimeout(r, 20)));
  await page.evaluate(() => { const h = document.getElementById("host"); h.appendChild(window.__kids.b); window.__log.push("host moved b in a later task"); });
});
await browser.close();
```
