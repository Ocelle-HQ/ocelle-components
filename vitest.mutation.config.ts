// Stryker's Vitest configuration (stryker.config.json, research.md R-08): every project of vitest.config.ts except
// gates-integration, whose tests start real tools, tokens-browser and styles-browser, whose tests start Chromium
// (003 research.md R-09), storybook-integration, whose global setup builds the Storybook (002 research.md R-03, R-10,
// contracts/gates.md § Mutation), and, since 005 (research.md R-11, R-12), elements, which
// stryker.elements.config.json mutates on its own, elements-build, whose tests start tsc, Vite and pnpm pack, and
// elements-browser, whose tests start Chromium. Stryker runs only in-process tests for each mutant, so a mutant that
// only an excluded project's test covers is reported as NoCoverage, and a shard's time follows its line bound.
import { defineConfig } from "vitest/config";
import base from "./vitest.config.ts";

/** The projects Stryker does not run. */
const excluded = new Set([
  "gates-integration",
  "tokens-browser",
  "styles-browser",
  "storybook-integration",
  "elements",
  "elements-build",
  "elements-browser",
]);

const projects = (base.test?.projects ?? []).filter(
  (project) => typeof project !== "object" || !("test" in project) || !excluded.has(typeof project.test.name === "string" ? project.test.name : ""),
);

export default defineConfig({ test: { projects } });
