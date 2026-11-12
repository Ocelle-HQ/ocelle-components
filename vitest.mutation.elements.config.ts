// Stryker's Vitest configuration for element source (stryker.elements.config.json, 005 research.md R-12): only the
// elements project of vitest.config.ts, the in-process browser-mode tests, so per-test coverage reaches Stryker and a
// mutant runs only the tests that cover it.
import { defineConfig } from "vitest/config";
import base from "./vitest.config.ts";

const projects = (base.test?.projects ?? []).filter(
  (project) => typeof project === "object" && "test" in project && project.test.name === "elements",
);

export default defineConfig({ test: { projects } });
