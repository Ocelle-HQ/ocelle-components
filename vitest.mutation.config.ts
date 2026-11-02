// Stryker's Vitest configuration (stryker.config.json, research.md R-08): every project of vitest.config.ts except
// gates-integration, whose tests start real tools. Stryker runs only in-process tests for each mutant, so a mutant
// that only a gates-integration test covers is reported as NoCoverage, and a shard's time follows its line bound.
import { defineConfig } from "vitest/config";
import base from "./vitest.config.ts";

const projects = (base.test?.projects ?? []).filter(
  (project) => typeof project !== "object" || !("test" in project) || project.test?.name !== "gates-integration",
);

export default defineConfig({ test: { projects } });
