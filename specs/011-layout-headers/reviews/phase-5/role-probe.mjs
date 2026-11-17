// The role probe of contracts/checks.md § Role probe (011 FR-028, research.md R-11; T047), phase 5 evidence, not a
// test: builds the browser build of the working tree's package source into a temporary directory (the package's
// vite.browser.config.ts, only its output directory replaced, as test/browser/global-setup.ts does), loads it and the
// axe-core #10 pins on one page in the Chromium of OCELLE_CHROMIUM_PATH (or Playwright's own), and prints, as JSON,
// axe-core's version and `axe.commons.aria.getRole(host)` for a rail with `label`, one with a host `aria-label` and
// one with neither. Run from the repository root: `node specs/011-layout-headers/reviews/phase-5/role-probe.mjs`.
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
      '<ocelle-personal-rail id="labelled" label="Personal"><a href="#inbox">In</a><a href="#account" slot="bottom">Me</a></ocelle-personal-rail>' +
        '<ocelle-personal-rail id="host" aria-label="Other"><a href="#inbox">In</a><a href="#account" slot="bottom">Me</a></ocelle-personal-rail>' +
        '<ocelle-personal-rail id="neither"><a href="#inbox">In</a><a href="#account" slot="bottom">Me</a></ocelle-personal-rail>',
    );
    await page.addScriptTag({ content: readFileSync(join(dir, "browser/ocelle-elements.js"), "utf8"), type: "module" });
    await page.addScriptTag({ content: readFileSync(join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8") });
    const read = await page.evaluate(async () => {
      await customElements.whenDefined("ocelle-personal-rail");
      await Promise.all([...document.querySelectorAll("ocelle-personal-rail")].map((host) => host.updateComplete));
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
