// Run in the exact Chromium or WebKit floor's namespace using the matching client.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { chromium, webkit } from "playwright";

const require = createRequire(import.meta.url);
const [engine, fixtureUrl, chromiumBinary] = process.argv.slice(2);
assert.ok(engine === "chromium" || engine === "webkit", "choose chromium or webkit");
assert.ok(fixtureUrl, "pass the running strict fixture URL");
const url = new URL(fixtureUrl);
assert.equal(url.protocol, "http:", "expect a loopback HTTP fixture");
assert.equal(url.hostname, "127.0.0.1", "expect the bound loopback address");
assert.equal(url.pathname, "/anchored-popover.html", "preflight the exact packaged fixture");

const csp = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'";
const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10_000) }).catch((error) => {
  throw new Error("strict fixture preflight could not reach the server from this namespace", { cause: error });
});
assert.equal(response.status, 200, "strict fixture preflight requires the exact route");
assert.equal(response.headers.get("content-security-policy"), csp, "strict fixture preflight requires the complete package policy");
await response.arrayBuffer();

const client = require("playwright/package.json").version;
const type = engine === "chromium" ? chromium : webkit;
if (engine === "webkit") {
  assert.equal(client, "1.43.1", "the WebKit floor needs the version-matched Playwright client");
  assert.match(webkit.executablePath(), /webkit-1992(?:[/\\]|$)/, "the WebKit floor requires revision 1992");
} else {
  assert.equal(client, "1.64.1", "use the pinned repository Chromium launcher");
  assert.ok(chromiumBinary, "pass the exact 135.0.7049.114 headless shell binary");
}

const browser = await type.launch(chromiumBinary === undefined ? {} : { executablePath: chromiumBinary });
try {
  const version = browser.version();
  assert.equal(version, engine === "chromium" ? "135.0.7049.114" : "17.4", "verify the browser version before exercising behavior");
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
  page.setDefaultTimeout(5000);
  await page.addInitScript(() => {
    const directives = [];
    Object.defineProperty(window, "__popoverCspViolations", { value: directives });
    document.addEventListener("securitypolicyviolation", (event) => directives.push(event.violatedDirective));
  });
  const errors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  page.on("response", (result) => {
    if (!result.ok()) failedRequests.push(result.url());
  });
  const loaded = await page.goto(url.href, { waitUntil: "load" });
  assert.equal(loaded?.status(), 200);
  assert.equal(loaded?.headers()["content-security-policy"], csp);

  const appearance = page.locator("#appearance");
  const appearanceControl = appearance.locator("button[part=trigger]");
  const appearancePanel = appearance.locator("[part=surface]");
  const isOpen = () => appearancePanel.evaluate((element) => element.matches(":popover-open"));
  const hasFocus = (locator) => locator.evaluate((element) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active === element;
  });

  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  assert.equal(await hasFocus(appearanceControl), true, "native Tab reaches the appearance button");
  assert.equal(await appearance.getByRole("button", { name: "Appearance menu", exact: true }).count(), 1);
  await page.keyboard.press("Enter");
  assert.equal(await isOpen(), true, "native Enter opens the manual popover");
  assert.equal(await hasFocus(appearanceControl), true);
  await page.keyboard.press("Tab");
  assert.equal(await hasFocus(page.locator("#first")), true);
  await page.keyboard.press("Tab");
  assert.equal(await hasFocus(page.locator("#last")), true, "skip the disabled action");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await hasFocus(page.locator("#first")), true);
  await page.keyboard.press("Escape");
  assert.equal(await isOpen(), false);
  assert.equal(await hasFocus(appearanceControl), true);

  await page.keyboard.press("Space");
  assert.equal(await isOpen(), true, "native Space reopens the popover");
  const outside = page.locator("#outside");
  await outside.click();
  assert.equal(await isOpen(), false);
  assert.equal(await outside.getAttribute("data-activations"), "1");
  // Pointer focus is platform-specific. Use a second actual closed-state click on the same native control as the oracle.
  const dismissalFocus = await hasFocus(outside);
  await page.locator("#before").focus();
  await outside.click();
  assert.equal(await hasFocus(outside), dismissalFocus);
  const profile = page.locator("#profile");
  const profileControl = profile.getByRole("button", { name: "Profile menu", exact: true });
  assert.equal(await profileControl.count(), 1);
  const profileBox = await profileControl.boundingBox();
  assert.ok(profileBox, "the native profile button has a rendered box");
  // Let the browser hit-test through the slotted initials to the native trigger.
  await page.mouse.click(profileBox.x + profileBox.width / 2, profileBox.y + profileBox.height / 2);
  assert.equal(await profile.locator("[part=surface]").evaluate((element) => element.matches(":popover-open")), true);


  await page.mouse.click(profileBox.x + profileBox.width / 2, profileBox.y + profileBox.height / 2);
  assert.equal(await profile.locator("[part=surface]").evaluate((element) => element.matches(":popover-open")), false);

  const preparePlacement = async (width, height, mode) => {
    await page.setViewportSize({ width, height });
    await page.locator("html").evaluate((root, selected) => { root.setAttribute("data-placement-fixture", selected); }, mode);
    assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight]), [width, height]);
  };
  const waitForFrames = () => page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => { requestAnimationFrame(() => { resolve(undefined); }); });
  }));
  const nativeOpen = async (host) => {
    await host.locator("button[part=trigger]").focus();
    await page.keyboard.press("Enter");
    assert.equal(await host.locator("[part=surface]").evaluate((element) => element.matches(":popover-open")), true);
    await waitForFrames();
  };
  const placementGeometry = (host) => host.evaluate((element) => {
    const anchor = element.shadowRoot.querySelector("[part=trigger]").getBoundingClientRect();
    const box = element.shadowRoot.querySelector("[part=surface]").getBoundingClientRect();
    const clip = element.parentElement;
    const bounds = clip.getBoundingClientRect();
    const { transform, overflowX, overflowY } = getComputedStyle(clip);
    return {
      anchor: { top: anchor.top, bottom: anchor.bottom },
      box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height },
      clip: { top: bounds.top, bottom: bounds.bottom, transform, overflowX, overflowY },
      viewport: { width: innerWidth, height: innerHeight },
    };
  });
  const assertPlacement = async (host, edge) => {
    const { anchor, box, clip, viewport } = await placementGeometry(host);
    assert.notEqual(clip.transform, "none");
    assert.deepEqual([clip.overflowX, clip.overflowY], ["hidden", "hidden"]);
    const preferred = edge === "top" ? box.top >= anchor.bottom - 0.5 : box.bottom <= anchor.top + 0.5;
    assert.ok(preferred, `the ${edge} fixture preserves the side with usable space`);
    assert.ok(box.width > 0 && box.height > 0 && box.left >= -0.5 && box.top >= -0.5
      && box.right <= viewport.width + 0.5 && box.bottom <= viewport.height + 0.5, "the surface stays inside the actual viewport");
    return clip;
  };
  const pointer = async (action) => {
    const box = await action.boundingBox();
    assert.ok(box, "a real action has a rendered box");
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const documentScroll = () => page.evaluate(() => ({
    x: scrollX, y: scrollY, width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth,
  }));

  await preparePlacement(320, 440, "edges");
  for (const edge of ["top", "bottom"]) {
    const id = `placement-${edge}`;
    const host = page.locator(`#${id}`);
    await nativeOpen(host);
    const clip = await assertPlacement(host, edge);
    const first = host.locator("[data-first-action]");
    const start = await pointer(first);
    assert.ok(edge === "top" ? start.y > clip.bottom : start.y < clip.top, "the target hit lies beyond the transformed clip");
    await page.mouse.click(start.x, start.y);
    assert.equal(await first.getAttribute("data-trusted-clicks"), "1", "the projected action receives a trusted hit beyond the clip");
    const panel = host.locator("[part=surface]");
    const capacity = await panel.evaluate((element) => element.scrollHeight - element.clientHeight);
    assert.ok(capacity > 0, "tall content has a real inner scroll range");
    const beforeScroll = await documentScroll();
    assert.equal(beforeScroll.width, beforeScroll.client, "the narrow page has no horizontal overflow");
    await page.mouse.move(start.x, start.y);
    await page.mouse.wheel(0, capacity);
    const last = host.locator("[data-last-action]");
    const finalActionVisible = () => last.evaluate((action) => {
      const panel = action.closest("ocelle-anchored-popover").shadowRoot.querySelector("[part=surface]");
      const end = action.getBoundingClientRect();
      const visible = panel.getBoundingClientRect();
      return panel.scrollTop > 0 && end.top >= visible.top - 0.5 && end.bottom <= visible.bottom + 0.5;
    });
    const deadline = performance.now() + 5000;
    let visible = await finalActionVisible();
    while (!visible && performance.now() < deadline) {
      await new Promise((resolve) => { setTimeout(resolve, 50); });
      visible = await finalActionVisible();
    }
    assert.ok(visible, "native wheel scrolling makes the final action fully visible inside the panel");
    const end = await pointer(last);
    await page.mouse.click(end.x, end.y);
    assert.equal(await last.getAttribute("data-trusted-clicks"), "1", "inner scrolling makes the final action clickable");
    assert.deepEqual(await documentScroll(), beforeScroll, "the page did not scroll or widen");
    await host.locator("button[part=trigger]").focus();
    await page.keyboard.press("Escape");
    assert.equal(await panel.evaluate((element) => element.matches(":popover-open")), false);
  }

  await preparePlacement(520, 520, "edges");
  const enlargedHost = page.locator("#placement-top");
  await nativeOpen(enlargedHost);
  const enlargedAction = enlargedHost.locator("[data-first-action]");
  const baselineFont = await enlargedAction.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  await page.locator("html").evaluate((root) => { root.setAttribute("data-placement-fixture", "large-text"); });
  await waitForFrames();
  assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight]), [520, 520], "text enlargement does not resize the viewport");
  const enlarged = await enlargedAction.locator("span").evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return {
      font: Number.parseFloat(getComputedStyle(element).fontSize),
      lines: new Set(Array.from(range.getClientRects(), ({ top }) => top)).size,
    };
  });
  assert.ok(baselineFont > 0);
  assert.equal(enlarged.font, baselineFont * 2, "native action text doubles independently of the viewport");
  assert.ok(enlarged.lines > 1, "the enlarged label occupies multiple rendered line boxes");
  await assertPlacement(enlargedHost, "top");
  const beforeTabs = await documentScroll();
  assert.equal(beforeTabs.width, beforeTabs.client);
  const controls = await enlargedHost.locator(".placement-actions button").all();
  assert.ok(controls.length > 1);
  for (const action of controls) {
    await page.keyboard.press("Tab");
    assert.equal(await hasFocus(action), true, "native Tab reaches every enlarged action");
  }
  assert.equal(await controls.at(-1).evaluate((element) => {
    const style = getComputedStyle(element);
    return element.matches(":focus-visible") && style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
  }), true, "the last enlarged action shows a native keyboard focus outline");
  assert.deepEqual(await documentScroll(), beforeTabs, "native keyboard scrolling leaves the page unchanged");

  assert.deepEqual(errors, [], "no uncaught errors on the actual fixture");
  assert.deepEqual(failedRequests, [], "every fixture asset loads");
  assert.deepEqual(await page.evaluate(() => window.__popoverCspViolations), [], "no policy violations");
  console.log(JSON.stringify({ engine, version, client, fixture: url.href, policy: csp, result: "pass" }));
} finally {
  await browser.close();
}
