import { globSync, readFileSync } from "node:fs";
import { matchesGlob } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import base from "../../vitest.config.ts";
import mutation from "../../vitest.mutation.config.ts";
import mutationElements from "../../vitest.mutation.elements.config.ts";

// The Vitest projects and the mutation runs (002 contracts/gates.md § Mutation, research.md R-03 *Mutation path*;
// PLAN-FRESH-2-002): vitest.mutation.config.ts drops exactly the projects whose tests start tools, a browser or a
// Storybook build, and, resolving every project's include and exclude against the repository's test files, each test
// file belongs to exactly one project, so none sits both in a project Stryker runs and in one it excludes. The check
// fails if the tokens project's browser exclude or the gates project's integration exclude is removed.
interface Project {
  readonly name: string;
  readonly environment: string | undefined;
  readonly include: readonly string[];
  readonly exclude: readonly string[];
}

function projectsOf(config: typeof base): Project[] {
  return (config.test?.projects ?? []).map((project) => {
    const test = (project as { test?: { name?: unknown; environment?: string; include?: string[]; exclude?: string[] } }).test ?? {};
    return { name: String(test.name), environment: test.environment, include: test.include ?? [], exclude: test.exclude ?? [] };
  });
}

const repo = fileURLToPath(new URL("../..", import.meta.url));
const all = projectsOf(base);
const kept = projectsOf(mutation);
const keptElements = projectsOf(mutationElements);

/**
 * The timing-sensitive in-process element files (specs/010-feedback-forms operator round 7, O7-01; decision (b),
 * reviews/phase-2/decision-stop-1.md): the notice suites, the plants file, the capture and timing files, and the form
 * suites whose shared bodies run the capture and drive.after at the test W. Only these run one at a time, in
 * elements-timing; every other in-process element file runs in elements, in parallel as on main.
 */
const timingFiles = [
  "packages/elements/test/notice.test.ts",
  "packages/elements/test/plants.test.ts",
  "packages/elements/test/live-capture.test.ts",
  "packages/elements/test/in-process-timing.test.ts",
  "packages/elements/test/driver.test.ts",
  "packages/elements/test/live-timing.test.ts",
  "packages/elements/test/form-input.test.ts",
  "packages/elements/test/form-select.test.ts",
];

/** A project of vitest.config.ts as written, its top-level keys (optimizeDeps) and its test settings. */
interface RawProject {
  readonly optimizeDeps?: unknown;
  readonly test?: {
    readonly name?: unknown;
    readonly include?: readonly string[];
    readonly fileParallelism?: boolean;
    readonly browser?: { readonly provider?: { readonly options?: { readonly launchOptions?: unknown } } };
  };
}
const raw = (base.test?.projects ?? []) as readonly RawProject[];
const rawOf = (name: string): RawProject | undefined => raw.find((each) => each.test?.name === name);

/** The repository's test files: every *.test.ts outside installed packages, dot directories, plants and fixtures. */
const testFiles = globSync("**/*.test.ts", { cwd: repo })
  .map((path) => path.split("\\").join("/"))
  .filter((path) => !path.split("/").some((part) => part === "node_modules" || part === "dist" || part.startsWith(".")))
  .filter((path) => !path.startsWith("gates/plants/") && !path.startsWith("gates/test/fixtures/"))
  .sort();

function inProject(project: Project, path: string): boolean {
  return project.include.some((glob) => matchesGlob(path, glob)) && !project.exclude.some((glob) => matchesGlob(path, glob));
}

describe("vitest.mutation.config.ts", () => {
  // 005 research.md R-12: elements is mutated by stryker.elements.config.json; elements-build and elements-browser
  // start tools or Chromium; elements-node stays. 008 research.md R-14: elements-touch is mutated with elements.
  // Operator round 7 of specs/010-feedback-forms (O7-01): elements-timing, the serial timing files, is mutated with
  // elements.
  const notMutated = ["tokens-browser", "styles-browser", "elements", "elements-timing", "elements-touch", "elements-build", "elements-browser", "storybook-integration", "gates-integration"];

  it("excludes exactly tokens-browser, styles-browser, elements, elements-timing, elements-touch, elements-build, elements-browser, storybook-integration and gates-integration from the projects of vitest.config.ts, and splits tokens", () => {
    expect(all.map((project) => project.name).filter((name) => !kept.some((project) => project.name === name))).toEqual(notMutated);
    // 007 research.md R-05 (lever 1): the mutation configuration splits tokens in two, source-table.test.ts alone in
    // tokens-source-table and the rest in tokens; every other kept project is unchanged. This replaces the plain
    // equality with the filtered list, which the split breaks; vitest-mutation-config.test.ts compares every setting.
    const sourceTable = "packages/tokens/test/source-table.test.ts";
    const [tokens, ...others] = all.filter((project) => !notMutated.includes(project.name));
    expect(tokens?.name).toBe("tokens");
    expect(kept).toEqual([
      { name: "tokens-source-table", environment: tokens?.environment, include: [sourceTable], exclude: tokens?.exclude },
      { name: "tokens", environment: tokens?.environment, include: tokens?.include, exclude: [...(tokens?.exclude ?? []), sourceTable] },
      ...others,
    ]);
    expect(kept.map((project) => project.name)).toContain("elements-node");
  });
});

describe("vitest.mutation.elements.config.ts and stryker.elements.config.json (005 research.md R-12)", () => {
  // 008 research.md R-14: the in-process touch rows kill mutants too, so elements-touch is mutated with elements; since
  // operator round 7 of specs/010-feedback-forms (O7-01), elements-timing too, so per-test coverage still reaches
  // Stryker.
  it("holds exactly the elements, elements-timing and elements-touch projects of vitest.config.ts", () => {
    const names = ["elements", "elements-timing", "elements-touch"];
    expect(keptElements).toEqual(all.filter((project) => names.includes(project.name)));
    expect(keptElements.map((project) => project.name)).toEqual(names);
  });

  // 008 plan decision 25, research.md R-15 (operator decision 2026-11-15): the elements configuration alone raises
  // Stryker's dry-run limit to 30 minutes; the per-mutant limits and stryker.config.json stay at Stryker's defaults.
  it("is stryker.config.json with its own Vitest config and its own report file", () => {
    const read = (path: string): Record<string, unknown> => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")) as Record<string, unknown>;
    const general = read("stryker.config.json");
    expect(read("stryker.elements.config.json")).toEqual({
      ...general,
      vitest: { configFile: "vitest.mutation.elements.config.ts", related: false },
      jsonReporter: { fileName: "reports/mutation/mutation-elements.json" },
      dryRunTimeoutMinutes: 30,
    });
    expect(general.vitest).toEqual({ configFile: "vitest.mutation.config.ts", related: false });
    expect(Object.keys(general)).not.toContain("dryRunTimeoutMinutes");
  });
});

describe("the Vitest projects", () => {
  it("put each test file of the repository in exactly one project", () => {
    const owners = Object.fromEntries(testFiles.map((path) => [path, all.filter((project) => inProject(project, path)).map((project) => project.name)]));
    const notOne = Object.fromEntries(Object.entries(owners).filter(([, names]) => names.length !== 1));
    expect(notOne).toEqual({});
    expect(testFiles).toContain("packages/tokens/test/browser/themes.test.ts");
    expect(owners["packages/tokens/test/browser/themes.test.ts"]).toEqual(["tokens-browser"]);
    expect(owners["storybook/test/integration/render.test.ts"]).toEqual(["storybook-integration"]);
    expect(owners["storybook/test/unit/swatches.test.ts"]).toEqual(["storybook"]);
  });

  // 003 research.md R-09, contracts/checks.md § Tests added: the styles browser tests run in their own project, which
  // Stryker does not run, and the styles project keeps every other styles test.
  it("put a styles browser test in styles-browser only, and any other styles test in styles only", () => {
    const ownersOf = (path: string) => all.filter((project) => inProject(project, path)).map((project) => project.name);
    expect(ownersOf("packages/styles/test/browser/x.test.ts")).toEqual(["styles-browser"]);
    expect(ownersOf("packages/styles/test/x.test.ts")).toEqual(["styles"]);
  });

  // 005 research.md R-11: the element node, build and fixture tests run in their own node projects, and the elements
  // browser-mode project keeps every other element test.
  it("put an element node, build or fixture test in its own node project only, and any other element test in elements only", () => {
    const ownersOf = (path: string) => all.filter((project) => inProject(project, path)).map((project) => project.name);
    expect(ownersOf("packages/elements/test/node/x.test.ts")).toEqual(["elements-node"]);
    expect(ownersOf("packages/elements/test/node/deep/x.test.ts")).toEqual(["elements-node"]);
    expect(ownersOf("packages/elements/test/build/x.test.ts")).toEqual(["elements-build"]);
    expect(ownersOf("packages/elements/test/browser/x.test.ts")).toEqual(["elements-browser"]);
    expect(ownersOf("packages/elements/test/x.test.ts")).toEqual(["elements"]);
    expect(ownersOf("packages/elements/test/scenarios/x.test.ts")).toEqual(["elements"]);
    // Operator round 7 of specs/010-feedback-forms (O7-01): the eight timing files in elements-timing only; a fake-clock
    // file and any other element test stay in elements.
    expect(Object.fromEntries(timingFiles.map((path) => [path, ownersOf(path)]))).toEqual(Object.fromEntries(timingFiles.map((path) => [path, ["elements-timing"]])));
    expect(ownersOf("packages/elements/test/notice-rules.test.ts")).toEqual(["elements"]);
  });

  // Operator round 7 of specs/010-feedback-forms (O7-01; operator: "Serial project for timing files (Recommended)"):
  // only the timing files of decision (b) (reviews/phase-2/decision-stop-1.md) run one at a time, in elements-timing
  // directly after elements; elements and elements-touch run their files in parallel, as on main. elements-build keeps
  // its own serial run (two package builds never write dist/ at once).
  it("run only the eight timing files one at a time, in elements-timing directly after elements", () => {
    const names = raw.map((each) => each.test?.name);
    expect(names.indexOf("elements-timing")).toBe(names.indexOf("elements") + 1);
    expect(rawOf("elements-timing")?.test?.include).toEqual(timingFiles);
    expect({
      elements: rawOf("elements")?.test?.fileParallelism,
      timing: rawOf("elements-timing")?.test?.fileParallelism,
      touch: rawOf("elements-touch")?.test?.fileParallelism,
      build: rawOf("elements-build")?.test?.fileParallelism,
    }).toEqual({ elements: undefined, timing: false, touch: undefined, build: false });
    expect(Object.keys(rawOf("elements")?.test ?? {})).not.toContain("fileParallelism");
    expect(Object.keys(rawOf("elements-touch")?.test ?? {})).not.toContain("fileParallelism");
  });

  // 008 research.md R-14: the in-process touch rows `test/*.touch.test.ts` run in elements-touch only, with the
  // elements project's excludes, so a fixture, node or build file named *.touch.test.ts stays in its own project.
  it("put an in-process touch test in elements-touch only, and a fixture, node or build touch test in its own project only", () => {
    const ownersOf = (path: string) => all.filter((project) => inProject(project, path)).map((project) => project.name);
    expect({
      inProcess: ownersOf("packages/elements/test/x.touch.test.ts"),
      fixture: ownersOf("packages/elements/test/browser/x.touch.test.ts"),
      node: ownersOf("packages/elements/test/node/x.touch.test.ts"),
      build: ownersOf("packages/elements/test/build/x.touch.test.ts"),
    }).toEqual({ inProcess: ["elements-touch"], fixture: ["elements-browser"], node: ["elements-node"], build: ["elements-build"] });
    // Since operator round 7 of specs/010-feedback-forms (O7-01), elements also excludes the eight timing files, which
    // elements-timing holds with the same excludes as elements-touch.
    const excludeOf = (name: string) => all.find((project) => project.name === name)?.exclude;
    expect(excludeOf("elements-touch")).toEqual(excludeOf("elements")?.filter((glob) => glob !== "packages/elements/test/*.touch.test.ts" && !timingFiles.includes(glob)));
    expect(excludeOf("elements")).toEqual(expect.arrayContaining(timingFiles));
    expect(excludeOf("elements-timing")).toEqual(excludeOf("elements-touch"));
  });

  // 008 research.md R-14: both browser-mode element projects run at the fixture's 1280 × 800, elements as a mouse
  // device and elements-touch in a context with hasTouch; both register the same commands, 011's document readers
  // (research.md R-13) among them, and the live-region capture's liveStart and liveStop (specs/010-feedback-forms
  // contracts/testing.md § Live-region capture; the landing's second merge of main). Since operator round 7 of
  // specs/010-feedback-forms (O7-01), elements-timing runs as elements does, with its provider options (launchOptions,
  // so OCELLE_CHROMIUM_PATH reaches it) and its pre-bundled Lit directives.
  it("run elements, elements-timing and elements-touch in browser mode at 1280 × 800, only elements-touch with hasTouch, with the same commands", () => {
    const browser = (name: string) => {
      const project = (base.test?.projects ?? []).find((each) => (each as { test?: { name?: unknown } }).test?.name === name) as
        | { test?: { browser?: { enabled?: boolean; viewport?: unknown; provider?: { options?: { contextOptions?: { hasTouch?: boolean } } }; commands?: Record<string, unknown> } } }
        | undefined;
      const options = project?.test?.browser;
      return {
        enabled: options?.enabled,
        viewport: options?.viewport,
        hasTouch: options?.provider?.options?.contextOptions?.hasTouch === true,
        commands: Object.keys(options?.commands ?? {}).sort(),
      };
    };
    const commands = ["activeElement", "axTree", "emulateForcedColors", "emulateReducedMotion", "liveStart", "liveStop", "pointerPath", "scrollWidth", "textBoxes", "touchTap"];
    expect({ elements: browser("elements"), timing: browser("elements-timing"), touch: browser("elements-touch") }).toEqual({
      elements: { enabled: true, viewport: { width: 1280, height: 800 }, hasTouch: false, commands },
      timing: { enabled: true, viewport: { width: 1280, height: 800 }, hasTouch: false, commands },
      touch: { enabled: true, viewport: { width: 1280, height: 800 }, hasTouch: true, commands },
    });
    const elements = rawOf("elements");
    const timing = rawOf("elements-timing");
    expect(elements?.test?.browser?.provider?.options).toBeDefined();
    expect(timing?.test?.browser?.provider?.options).toEqual(elements?.test?.browser?.provider?.options);
    expect(timing?.test?.browser?.provider?.options?.launchOptions).toEqual(elements?.test?.browser?.provider?.options?.launchOptions);
    expect(elements?.optimizeDeps).toBeDefined();
    expect(timing?.optimizeDeps).toEqual(elements?.optimizeDeps);
  });

  it("run elements-node, elements-build and elements-browser in node, on exactly their own directory", () => {
    const pick = (name: string) => all.find((project) => project.name === name);
    expect(["elements-node", "elements-build", "elements-browser"].map(pick)).toEqual([
      { name: "elements-node", environment: "node", include: ["packages/elements/test/node/**/*.test.ts"], exclude: expect.arrayContaining(["gates/plants/**"]) as unknown },
      { name: "elements-build", environment: "node", include: ["packages/elements/test/build/**/*.test.ts"], exclude: expect.arrayContaining(["gates/plants/**"]) as unknown },
      { name: "elements-browser", environment: "node", include: ["packages/elements/test/browser/**/*.test.ts"], exclude: expect.arrayContaining(["gates/plants/**"]) as unknown },
    ]);
    expect(pick("elements")?.exclude).toEqual(
      expect.arrayContaining(["packages/elements/test/node/**", "packages/elements/test/build/**", "packages/elements/test/browser/**"]),
    );
  });

  it("keep no test file both in a project Stryker runs and in one it excludes", () => {
    const excluded = all.filter((project) => !kept.some((each) => each.name === project.name));
    const both = testFiles.filter((path) => kept.some((project) => inProject(project, path)) && excluded.some((project) => inProject(project, path)));
    expect(both).toEqual([]);
    expect(testFiles.filter((path) => excluded.some((project) => inProject(project, path))).length).toBeGreaterThan(3);
  });
});
