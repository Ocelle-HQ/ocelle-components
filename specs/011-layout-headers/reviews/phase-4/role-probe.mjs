// The role probe of contracts/checks.md § Role probe (011 FR-028, research.md R-11; T040), phase 4 evidence, not a
// test: builds the browser build of the working tree's package source into a temporary directory (the package's
// vite.browser.config.ts, only its output directory replaced, as test/browser/global-setup.ts does), loads it and the
// axe-core #10 pins on one page in the Chromium of OCELLE_CHROMIUM_PATH (or Playwright's own), and prints, as JSON,
// axe-core's version and `axe.commons.aria.getRole(host)` for a sidebar with `label`, one with a host `aria-label` and
// one with neither. Run from the repository root: `node specs/011-layout-headers/reviews/phase-4/role-probe.mjs`.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { build } from "vite";

const elements = join(process.cwd(), "packages/elements");
const dir = mkdtempSync(join(tmpdir(), "role-probe-"));
try {
  await build({ configFile: join(elements, "vite.browser.config.ts"), root: elements, logLevel: "error", build: { outDir: dir } });
  const executablePath = process.env.OCELLE_CHROMIUM_PATH === undefined || process.env.OCELLE_CHROMIUM_PATH === "" ? undefined : process.env.OCELLE_CHROMIUM_PATH;
  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(
      '<ocelle-context-sidebar id="labelled" label="Team"><p slot="head">Kitty team</p><div>Missions</div></ocelle-context-sidebar>' +
        '<ocelle-context-sidebar id="host" aria-label="Other"><p slot="head">Kitty team</p><div>Missions</div></ocelle-context-sidebar>' +
        '<ocelle-context-sidebar id="neither"><p slot="head">Kitty team</p><div>Missions</div></ocelle-context-sidebar>',
    );
    await page.addScriptTag({ content: readFileSync(join(dir, "browser/ocelle-elements.js"), "utf8"), type: "module" });
    await page.addScriptTag({ content: readFileSync(join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8") });
    const read = await page.evaluate(async () => {
      await customElements.whenDefined("ocelle-context-sidebar");
      await Promise.all([...document.querySelectorAll("ocelle-context-sidebar")].map((host) => host.updateComplete));
      const axe = globalThis.axe;
      axe.setup(document);
      try {
        return { axeCore: axe.version, roles: Object.fromEntries(["labelled", "host", "neither"].map((id) => [id, axe.commons.aria.getRole(document.getElementById(id))])) };
      } finally {
        axe.teardown();
      }
    });
    console.log(JSON.stringify(read));
  } finally {
    await browser.close();
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
