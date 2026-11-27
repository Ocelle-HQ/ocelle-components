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
  assert.deepEqual(errors, [], "no uncaught errors on the actual fixture");
  assert.deepEqual(failedRequests, [], "every fixture asset loads");
  assert.deepEqual(await page.evaluate(() => window.__popoverCspViolations), [], "no policy violations");
  console.log(JSON.stringify({ engine, version, client, fixture: url.href, policy: csp, result: "pass" }));
} finally {
  await browser.close();
}
