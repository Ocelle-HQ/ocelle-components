// Stryker's Vitest configuration (stryker.config.json, research.md R-08): every project of vitest.config.ts except
// gates-integration, whose tests start real tools, tokens-browser, whose tests start Chromium, and
// storybook-integration, whose global setup builds the Storybook (002 research.md R-03, R-10, contracts/gates.md
// § Mutation). Stryker runs only in-process tests for each mutant, so a mutant that only an
// excluded project's test covers is reported as NoCoverage, and a shard's time follows its line bound.
import { defineConfig } from "vitest/config";
import base from "./vitest.config.ts";

/** The projects Stryker does not run. */
const excluded = new Set(["gates-integration", "tokens-browser", "storybook-integration"]);

const projects = (base.test?.projects ?? []).filter(
  (project) => typeof project !== "object" || !("test" in project) || !excluded.has(typeof project.test.name === "string" ? project.test.name : ""),
);

export default defineConfig({ test: { projects } });
