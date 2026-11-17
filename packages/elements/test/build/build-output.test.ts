import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildPackage, elements } from "./package-build.ts";

// The test-only pass count stays out of the shipped build (009 research.md R-13, plan.md; landing review L1-05,
// operator round phase 2 round 3, O3-05; T071). After the package's build script, neither the module build of the
// list-detail scheduling module (dist/list-detail-measure.js) nor the browser build (dist/browser/ocelle-elements.js)
// holds `passCount`, and the module build holds no module-level pass counter (`passes`, the name tsc keeps; the
// browser build is minified, so there it is the exported name that is looked for); the package root (dist/index.js)
// exports neither. test/list-detail-pass.test.ts counts the passes from their effect on the grid instead. In the
// elements-build project (not elements-node, as T071 first named it), because it runs the build, and that project runs
// its files one at a time, so two builds never write dist/ at once.
const dist = join(elements, "dist");

/** A built file's text; empty when it is missing, so the assertions report what is missing. */
function built(name: string): string {
  const path = join(dist, name);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

beforeAll(async () => {
  await buildPackage();
}, 300_000);

describe("the shipped build holds no test-only pass count (O3-05)", () => {
  it("dist/list-detail-measure.js, dist/browser/ocelle-elements.js and dist/index.js hold no passCount and no pass counter", () => {
    const measure = built("list-detail-measure.js");
    const browser = built("browser/ocelle-elements.js");
    const root = built("index.js");
    expect({
      built: [measure, browser, root].map((text) => text.length > 0),
      measure: { passCount: measure.includes("passCount"), counter: /\bpasses\b/.test(measure) },
      browser: { passCount: browser.includes("passCount") },
      root: { passCount: root.includes("passCount"), passes: /\bpasses\b/.test(root) },
      // the scheduling module itself still ships: the element imports it
      measureClass: measure.includes("class ListDetailMeasure"),
    }).toEqual({
      built: [true, true, true],
      measure: { passCount: false, counter: false },
      browser: { passCount: false },
      root: { passCount: false, passes: false },
      measureClass: true,
    });
  });
});
