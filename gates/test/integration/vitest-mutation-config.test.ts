import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { repo } from "./workspace.ts";

// Stryker's vitest-runner uses vitest.mutation.config.ts: every project of vitest.config.ts except gates-integration,
// tokens-browser, styles-browser, storybook-integration (002 contracts/gates.md § Mutation, 003 research.md R-09) and,
// since 005 (research.md R-11, R-12), elements (mutated by stryker.elements.config.json), elements-build and
// elements-browser, so a mutant that only a tool-, browser- or build-starting test covers is reported as NoCoverage
// (research.md R-08). The test first asserts that the file exists and only then loads it, so at the red commit it
// fails on that assertion.
interface Project {
  readonly test?: { readonly name?: unknown };
}

interface ConfigModule {
  readonly default: { readonly test?: { readonly projects?: readonly Project[] } };
}

async function projectsOf(file: string): Promise<readonly Project[]> {
  const module = (await import(pathToFileURL(join(repo, file)).href)) as ConfigModule;
  return module.default.test?.projects ?? [];
}

describe("vitest.mutation.config.ts", () => {
  it("holds every project of vitest.config.ts except gates-integration, tokens-browser, styles-browser, storybook-integration, elements, elements-build and elements-browser", async () => {
    expect(existsSync(join(repo, "vitest.mutation.config.ts"))).toBe(true);
    const all = await projectsOf("vitest.config.ts");
    const mutation = await projectsOf("vitest.mutation.config.ts");
    expect(all.map((project) => project.test?.name)).toEqual([
      "tokens",
      "tokens-browser",
      "styles",
      "styles-browser",
      "elements",
      "elements-node",
      "elements-build",
      "elements-browser",
      "storybook",
      "storybook-integration",
      "gates",
      "gates-integration",
    ]);
    const excluded = ["gates-integration", "tokens-browser", "styles-browser", "storybook-integration", "elements", "elements-build", "elements-browser"];
    expect(mutation).toEqual(all.filter((project) => !excluded.includes(String(project.test?.name))));
    expect(mutation.map((project) => project.test?.name)).toEqual(["tokens", "styles", "elements-node", "storybook", "gates"]);
  });
});
