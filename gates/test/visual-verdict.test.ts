import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import type { Plant } from "../lib/plant-judge.ts";
import {
  baselineName,
  judge,
  keptFiles,
  ownStories,
  parseBaselineName,
  parseResult,
  parseUpdateArgs,
  plantBaselinesDir,
  plantModeProblem,
  plantRequests,
  storyThemes,
  strayBaselines,
  updatePlan,
  updateSummary,
  verdictOf,
  visualFindings,
  visualResult,
} from "../lib/visual-verdict.ts";
import type { Capture, CaptureEntry, CaptureStatus, Theme, Verdict } from "../lib/visual-verdict.ts";

// The visual gate's verdicts and the baseline command's update plan (FR-003 to FR-005, FR-008, FR-026 to FR-028,
// FR-030, FR-031; contracts/gates.md § `visual`, § `visual:update`; data-model.md § Baseline, § Verdict per
// story-theme; research.md R-11). Captures are written by hand: a status, its details, and for a captured one some
// bytes. Every expected line is written from the contracts.

const bytes = (...values: number[]): Uint8Array => Uint8Array.from(values);
const A = bytes(1, 2, 3);
const B = bytes(1, 2, 4);

/** A capture of a story-theme: captured with bytes, or another status with its details. */
function cap(story: string, theme: Theme, status: CaptureStatus = "captured", details: Partial<CaptureEntry> = {}, content: Uint8Array = A): Capture {
  const entry: CaptureEntry = { story, theme, status, ...(status === "captured" ? { file: `${story}.${theme}.png` } : {}), ...details };
  return status === "captured" ? { entry, bytes: content } : { entry };
}

const failures: Record<Exclude<CaptureStatus, "captured">, Partial<CaptureEntry>> = {
  "render-failed": { message: "STORY_THREW_EXCEPTION: render throws on purpose" },
  "render-timeout": { message: "no render signal within 15 s" },
  "closed-shadow-root": { hosts: ["ocelle-x", "ocelle-y"] },
  "pointer-target": { message: "hover: no element matches .trigger" },
  font: { families: ["DejaVu Sans", "Liberation Serif"] },
  network: { urls: ["https://example.com/a.png"] },
  io: { calls: ["fetch /api/items", "localStorage.setItem"] },
};
const failing = (status: Exclude<CaptureStatus, "captured">): Capture => cap("x--y", "light", status, failures[status]);

describe("baselineName and parseBaselineName (data-model.md § Baseline)", () => {
  it("names a story-theme's baseline <story-id>.<theme>.png and reads it back", () => {
    expect(baselineName("tokens--colour", "dark")).toBe("tokens--colour.dark.png");
    expect(parseBaselineName("tokens--colour.dark.png")).toEqual({ story: "tokens--colour", theme: "dark" });
    expect(parseBaselineName("base-styles--prose-document.light.png")).toEqual({ story: "base-styles--prose-document", theme: "light" });
  });

  it("parses no other name: another theme, extension or case, no story id form, a path", () => {
    for (const name of ["tokens--colour.blue.png", "tokens--colour.light.PNG", "tokens--colour.light.png.bak", "tokens.light.png", "Tokens--colour.light.png", "notes.txt", "a/b--c.light.png", ".light.png", "a--b..light.png"]) {
      expect(parseBaselineName(name)).toBeUndefined();
    }
  });
});

describe("storyThemes", () => {
  it("is every story in each theme of the request, story by story", () => {
    expect(storyThemes({ stories: ["a--b", "c--d"], themes: ["light", "dark"] })).toEqual([
      { story: "a--b", theme: "light" },
      { story: "a--b", theme: "dark" },
      { story: "c--d", theme: "light" },
      { story: "c--d", theme: "dark" },
    ]);
    expect(storyThemes({ stories: ["a--b"], themes: ["dark"] })).toEqual([{ story: "a--b", theme: "dark" }]);
  });
});

describe("parseResult (contracts/container.md § Capture request and result)", () => {
  it("reads the entries of a result.json, each with its details", () => {
    const text = JSON.stringify([
      { story: "tokens--colour", theme: "dark", status: "captured", file: "tokens--colour.dark.png" },
      { story: "x--v", theme: "light", status: "io", calls: ["fetch /api/items"] },
    ]);
    expect(parseResult(text)).toEqual([
      { story: "tokens--colour", theme: "dark", status: "captured", file: "tokens--colour.dark.png" },
      { story: "x--v", theme: "light", status: "io", calls: ["fetch /api/items"] },
    ]);
  });

  it("refuses a text that is not a list of entries with a story, a theme and a known status, a captured one without its file", () => {
    for (const [text, problem] of [
      ["{", "result.json is not valid JSON"],
      ["{}", "result.json is not a list"],
      [JSON.stringify([{ theme: "light", status: "captured", file: "f" }]), "result.json#0 has no story"],
      [JSON.stringify([{ story: "a--b", theme: "blue", status: "font" }]), "result.json#0 has no theme light or dark"],
      [JSON.stringify([{ story: "a--b", theme: "light", status: "blurred" }]), "result.json#0 has an unknown status blurred"],
      [JSON.stringify([{ story: "a--b", theme: "light", status: "io" }, { story: "a--b", theme: "dark", status: "captured" }]), "result.json#1 is captured and names no file"],
    ] as const) {
      expect(() => parseResult(text)).toThrow(problem);
    }
  });
});

describe("verdictOf: the order of data-model.md § Verdict per story-theme, first match wins", () => {
  it.each([
    ["render-failed", failing("render-failed"), failing("io"), "render-failed", "STORY_THREW_EXCEPTION: render throws on purpose"],
    ["render-failed in run 2", cap("x--y", "light"), failing("render-failed"), "render-failed", "STORY_THREW_EXCEPTION: render throws on purpose"],
    ["render-timeout", failing("render-timeout"), failing("closed-shadow-root"), "render-timeout", "no render signal within 15 s"],
    ["closed-shadow-root", failing("pointer-target"), failing("closed-shadow-root"), "closed-shadow-root", "closed shadow root attached by ocelle-x, ocelle-y"],
    ["pointer-target", failing("pointer-target"), failing("font"), "pointer-target", "hover: no element matches .trigger"],
    ["font", failing("network"), failing("font"), "font", "text drawn in faces other than Schibsted Grotesk: DejaVu Sans, Liberation Serif"],
    ["network", failing("io"), failing("network"), "network", "requests outside the origin: https://example.com/a.png"],
    ["io", failing("io"), cap("x--y", "light", "captured", {}, B), "io", "run-time I/O: fetch /api/items, localStorage.setItem"],
  ] as const)("%s", (_, run1, run2, rule, message) => {
    expect(verdictOf(run1, run2, B)).toEqual({ rule, message });
  });

  it("nondeterministic before any baseline comparison: the two runs differ in a byte, the baseline missing or equal", () => {
    const expected = { rule: "nondeterministic", message: "run 1 and run 2 differ" };
    expect(verdictOf(cap("x--y", "light", "captured", {}, A), cap("x--y", "light", "captured", {}, B), undefined)).toEqual(expected);
    expect(verdictOf(cap("x--y", "light", "captured", {}, A), cap("x--y", "light", "captured", {}, B), A)).toEqual(expected);
    expect(verdictOf(cap("x--y", "light", "captured", {}, A), cap("x--y", "light", "captured", {}, bytes(1, 2)), A).rule).toBe("nondeterministic");
  });

  it("missing-baseline, then differs on any byte (also on length), then match", () => {
    expect(verdictOf(cap("x--y", "dark"), cap("x--y", "dark"), undefined)).toEqual({ rule: "missing-baseline", message: "no baseline x--y.dark.png" });
    expect(verdictOf(cap("x--y", "dark"), cap("x--y", "dark"), B)).toEqual({ rule: "differs", message: "the capture differs from its baseline x--y.dark.png" });
    expect(verdictOf(cap("x--y", "dark"), cap("x--y", "dark"), bytes(1, 2, 3, 0)).rule).toBe("differs");
    expect(verdictOf(cap("x--y", "dark"), cap("x--y", "dark"), bytes(1, 2, 3))).toEqual({ rule: "match", message: "" });
  });
});

describe("judge", () => {
  const wanted = [
    { story: "a--b", theme: "light" },
    { story: "a--b", theme: "dark" },
    { story: "c--d", theme: "light" },
    { story: "c--d", theme: "dark" },
  ] as const;
  const runs = (status: CaptureStatus = "captured"): Capture[] => [cap("c--d", "dark"), cap("a--b", "dark"), cap("c--d", "light", status, status === "captured" ? {} : failures.font), cap("a--b", "light")];

  it("gives one verdict per wanted story-theme, in their order, whatever the runs' order; baselines by file name", () => {
    const baselines = new Map([
      ["a--b.light.png", A],
      ["a--b.dark.png", B],
      ["c--d.dark.png", A],
    ]);
    expect(judge(wanted, runs(), [...runs()].reverse(), baselines).map((v) => `${v.story}/${v.theme} ${v.rule}`)).toEqual([
      "a--b/light match",
      "a--b/dark differs",
      "c--d/light missing-baseline",
      "c--d/dark match",
    ]);
    expect(judge(wanted, runs("font"), runs(), baselines)[2]).toEqual({ story: "c--d", theme: "light", rule: "font", message: "text drawn in faces other than Schibsted Grotesk: DejaVu Sans, Liberation Serif" });
  });

  it("throws naming the run and the story-theme it has no capture of", () => {
    expect(() => judge(wanted, runs().slice(1), runs(), new Map())).toThrow("run 1 has no capture of c--d/dark");
    expect(() => judge(wanted, runs(), runs().slice(0, 3), new Map())).toThrow("run 2 has no capture of a--b/light");
  });
});

describe("strayBaselines", () => {
  it("names the files whose name does not parse or whose story-theme is not known, in name order", () => {
    const known = storyThemes({ stories: ["tokens--colour"], themes: ["light", "dark"] });
    const names = ["tokens--colour.light.png", "notes.txt", "gone--story.light.png", "tokens--colour.dark.png", "tokens--colour.blue.png"];
    expect(strayBaselines(names, known)).toEqual(["gone--story.light.png", "notes.txt", "tokens--colour.blue.png"]);
    expect(strayBaselines(["tokens--colour.dark.png"], [{ story: "tokens--colour", theme: "light" }])).toEqual(["tokens--colour.dark.png"]);
    expect(strayBaselines([], known)).toEqual([]);
  });
});

const verdict = (story: string, theme: Theme, rule: Verdict["rule"], message = ""): Verdict => ({ story, theme, rule, message });

describe("visualFindings and visualResult (contracts/gates.md § `visual`)", () => {
  const verdicts = [verdict("a--b", "light", "match"), verdict("a--b", "dark", "differs", "the capture differs from its baseline a--b.dark.png"), verdict("c--d", "light", "io", "run-time I/O: cookie set")];

  it("gives one finding per verdict that is not a match, at <story-id>/<theme>, then one per stray baseline in its directory", () => {
    expect(visualFindings(verdicts, ["gone--story.light.png"], "storybook/baselines")).toEqual([
      { location: { path: "a--b/dark" }, gate: "visual", rule: "differs", message: "the capture differs from its baseline a--b.dark.png" },
      { location: { path: "c--d/light" }, gate: "visual", rule: "io", message: "run-time I/O: cookie set" },
      { location: { path: "storybook/baselines/gone--story.light.png" }, gate: "visual", rule: "stray-baseline", message: "the baseline names no story-theme of the index" },
    ]);
  });

  it("exits 0 naming the captures compared and the engines when every story-theme matches", () => {
    const all = [verdict("a--b", "light", "match"), verdict("a--b", "dark", "match")];
    expect(visualResult(all, [], "docker only: no cross-engine comparison")).toEqual({ exit: 0, summary: "visual: 2 captures match their baselines (docker only: no cross-engine comparison)" });
    expect(visualResult([verdict("a--b", "light", "match")], [], "docker+podman")).toEqual({ exit: 0, summary: "visual: 1 capture matches its baseline (docker+podman)" });
  });

  it("exits 1 with the findings and a summary counting them over the story-themes, a stray baseline alone included", () => {
    expect(visualResult(verdicts, [], "docker+podman")).toEqual({
      exit: 1,
      findings: visualFindings(verdicts, [], "storybook/baselines"),
      summary: "visual: 2 findings in 3 story-themes (docker+podman)",
    });
    const stray = visualResult([verdict("a--b", "light", "match")], ["x.png"], "docker+podman");
    expect(stray.exit === 1 ? [stray.findings.length, stray.summary] : stray).toEqual([1, "visual: 1 finding in 1 story-theme (docker+podman)"]);
  });
});

/** A PNG file of a w × h image, black but for the pixel at (0, 0). */
function image(w: number, h: number, first: readonly [number, number, number, number]): Uint8Array {
  const png = new PNG({ width: w, height: h });
  png.data.fill(0);
  for (let at = 3; at < png.data.length; at += 4) png.data[at] = 255;
  png.data.set(first, 0);
  return PNG.sync.write(png);
}

describe("keptFiles (FR-005, analysis G2)", () => {
  const base = image(2, 2, [0, 0, 0, 255]);
  const moved = image(2, 2, [255, 255, 255, 255]);
  const other = image(2, 2, [9, 9, 9, 255]);
  const run1 = [cap("tokens--colour", "light", "captured", {}, moved), cap("tokens--colour", "dark", "captured", {}, base), cap("a--b", "light", "captured", {}, base), cap("c--d", "light", "captured", {}, base)];
  const run2 = [cap("tokens--colour", "light", "captured", {}, moved), cap("tokens--colour", "dark", "captured", {}, base), cap("a--b", "light", "captured", {}, base), cap("c--d", "light", "captured", {}, other)];
  const verdicts = [verdict("tokens--colour", "light", "differs"), verdict("tokens--colour", "dark", "missing-baseline"), verdict("a--b", "light", "match"), verdict("c--d", "light", "nondeterministic")];

  it("keeps the capture and its diff image for differs, both runs for nondeterministic, and run 1 in baseline layout for differs and missing-baseline; nothing else", () => {
    const kept = keptFiles(verdicts, run1, run2, new Map([["tokens--colour.light.png", base]]));
    expect(kept.map((file) => file.path)).toEqual([
      "tokens--colour.light.actual.png",
      "tokens--colour.light.diff.png",
      "baselines/tokens--colour.light.png",
      "baselines/tokens--colour.dark.png",
      "c--d.light.run-1.png",
      "c--d.light.run-2.png",
    ]);
    const at = (path: string): Uint8Array | undefined => kept.find((file) => file.path === path)?.bytes;
    expect([at("tokens--colour.light.actual.png"), at("baselines/tokens--colour.light.png"), at("baselines/tokens--colour.dark.png"), at("c--d.light.run-1.png"), at("c--d.light.run-2.png")]).toEqual([moved, moved, base, base, other]);
    const diff = PNG.sync.read(Buffer.from(at("tokens--colour.light.diff.png") ?? []));
    expect([...diff.data.subarray(0, 4), ...diff.data.subarray(4, 8)]).toEqual([255, 0, 255, 255, 191, 191, 191, 255]);
  });
});

describe("updatePlan and updateSummary (contracts/gates.md § `visual:update`, operator decision 2026-11-11)", () => {
  it.each(["render-failed", "render-timeout", "closed-shadow-root", "pointer-target", "font", "network", "io", "nondeterministic"] as const)(
    "writes nothing when one story-theme ends at %s, among good ones; its finding is the refusal",
    (rule) => {
      const verdicts = [verdict("a--b", "light", "missing-baseline"), verdict("c--d", "dark", rule, "why"), verdict("e--f", "light", "differs")];
      const run1 = [cap("a--b", "light"), cap("c--d", "dark"), cap("e--f", "light")];
      expect(updatePlan(verdicts, run1, ["gone--story.light.png"], "storybook/baselines")).toEqual({
        refuse: [{ location: { path: "c--d/dark" }, gate: "visual", rule, message: "why" }],
      });
    },
  );

  it("writes a changed baseline over its file, removes a stray one, and leaves matches alone (n = added + changed)", () => {
    const capture = bytes(1, 2, 3, 4, 5, 6, 7);
    const plan = updatePlan([verdict("a--b", "light", "match"), verdict("a--b", "dark", "differs")], [cap("a--b", "light"), cap("a--b", "dark", "captured", {}, capture)], ["gone--story.light.png"], "storybook/baselines");
    expect(plan).toEqual({ write: [{ file: "a--b.dark.png", bytes: capture, kind: "changed" }], remove: ["gone--story.light.png"] });
    expect("write" in plan ? updateSummary(plan) : plan).toBe("baselines: wrote 1 files (0 added, 1 changed, 1 removed), 7 bytes in total");
  });

  it("counts a baseline written for a story-theme that had none as added", () => {
    const capture = bytes(9, 8, 7, 6, 5);
    const plan = updatePlan([verdict("a--b", "light", "missing-baseline"), verdict("a--b", "dark", "match")], [cap("a--b", "light", "captured", {}, capture), cap("a--b", "dark")], [], "storybook/baselines");
    expect(plan).toEqual({ write: [{ file: "a--b.light.png", bytes: capture, kind: "added" }], remove: [] });
    expect("write" in plan ? updateSummary(plan) : plan).toBe("baselines: wrote 1 files (1 added, 0 changed, 0 removed), 5 bytes in total");
  });

  it("writes nothing on an unchanged tree, and says so in the same line", () => {
    const plan = updatePlan([verdict("a--b", "light", "match")], [cap("a--b", "light")], [], "storybook/baselines");
    expect(plan).toEqual({ write: [], remove: [] });
    expect("write" in plan ? updateSummary(plan) : plan).toBe("baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total");
    expect(updateSummary({ write: [{ file: "a", bytes: bytes(1, 2), kind: "added" }, { file: "b", bytes: bytes(3), kind: "changed" }, { file: "c", bytes: bytes(4, 5, 6), kind: "added" }], remove: ["d", "e"] })).toBe(
      "baselines: wrote 3 files (2 added, 1 changed, 2 removed), 6 bytes in total",
    );
  });
});

describe("parseUpdateArgs", () => {
  it("reads --engine (auto by default), --plant and --story", () => {
    expect(parseUpdateArgs([])).toEqual({ engine: "auto" });
    expect(parseUpdateArgs(["--engine", "docker", "--plant", "visual/pass-x", "--story", "x--y"])).toEqual({ engine: "docker", plant: "visual/pass-x", story: "x--y" });
  });

  // CI run 43056264356 (PR #24): `pnpm run gate:visual -- --engine both` hands the script a leading "--", which pnpm
  // passes on; the gate stopped with "unknown argument --" before any engine ran.
  it("skips the -- that pnpm run passes on before the options", () => {
    expect(parseUpdateArgs(["--", "--engine", "both"])).toEqual({ engine: "both" });
    expect(parseUpdateArgs(["--", "--plant", "visual/pass-x", "--story", "x--y"])).toEqual({ engine: "auto", plant: "visual/pass-x", story: "x--y" });
    expect(parseUpdateArgs(["--"])).toEqual({ engine: "auto" });
  });

  it("stops on an unknown argument, a missing value and --story without --plant", () => {
    expect(parseUpdateArgs(["--fast"])).toEqual({ cause: "unknown argument --fast" });
    expect(parseUpdateArgs(["--engine"])).toEqual({ cause: "--engine needs a value" });
    expect(parseUpdateArgs(["--plant", "--story", "x"])).toEqual({ cause: "--plant needs a value" });
    expect(parseUpdateArgs(["--story", "x--y"])).toEqual({ cause: "--story needs --plant" });
  });
});

describe("the plant mode (research.md R-11, contracts/gates.md § `visual:update`)", () => {
  const pass: Plant = { expect: "pass", why: "w" };

  it("stops a plant of another gate, no such plant, a plant whose baselines are another's, and a captureAlone plant without --story", () => {
    expect(plantModeProblem("axe/pass-x", pass, undefined)).toBe("axe/pass-x is not a visual plant");
    expect(plantModeProblem("visual/pass-x", undefined, undefined)).toBe("no such plant: gates/plants/visual/pass-x");
    expect(plantModeProblem("visual/fail-x", { expect: "fail", why: "w", findings: [{ location: "a", rule: "b" }], baselinesOf: "pass-y" }, undefined)).toBe(
      "visual/fail-x: its baselines are those of visual/pass-y",
    );
    expect(plantModeProblem("visual/pass-second-render", { ...pass, captureAlone: true }, undefined)).toBe("visual/pass-second-render is captured alone: give --story <id>");
  });

  it("lets a plant run, and a captureAlone plant with --story", () => {
    expect(plantModeProblem("visual/pass-x", pass, undefined)).toBeUndefined();
    expect(plantModeProblem("visual/pass-second-render", { ...pass, captureAlone: true }, "second--render")).toBeUndefined();
  });

  it("takes the plant's own stories from the index: entries whose story file is a file of its tree/", () => {
    const index = [
      { id: "tokens--colour", title: "Tokens", name: "Colour", importPath: "./stories/tokens.stories.ts" },
      { id: "second--a", title: "Second", name: "A", importPath: "./stories/second.stories.ts" },
      { id: "base-styles--base-page", title: "Base styles", name: "Base page", importPath: "./stories/base.stories.ts" },
      { id: "second--b", title: "Second", name: "B", importPath: "./stories/second.stories.ts" },
    ];
    expect(ownStories(index, ["storybook/stories/second.stories.ts", "storybook/baselines/second--a.light.png"])).toEqual(["second--a", "second--b"]);
    expect(ownStories(index, ["storybook/stories/base.stories.ts"])).toEqual(["base-styles--base-page"]);
    expect(ownStories(index, ["stories/second.stories.ts"])).toEqual([]);
  });

  it("requests the own stories in both themes, or with --story one single-story-theme request per theme", () => {
    expect(plantRequests("visual/pass-x", ["x--a", "x--b"], undefined)).toEqual([{ stories: ["x--a", "x--b"], themes: ["light", "dark"] }]);
    expect(plantRequests("visual/pass-x", ["x--a", "x--b"], "x--b")).toEqual([
      { stories: ["x--b"], themes: ["light"] },
      { stories: ["x--b"], themes: ["dark"] },
    ]);
  });

  it("stops a plant with no story of its own and a --story that is not one of them", () => {
    expect(plantRequests("visual/pass-x", [], undefined)).toEqual({ cause: "visual/pass-x has no story of its own" });
    expect(plantRequests("visual/pass-x", ["x--a"], "tokens--colour")).toEqual({ cause: "--story tokens--colour is not one of the own stories of visual/pass-x (x--a)" });
  });

  it("writes a plant's baselines into its tree/storybook/baselines/", () => {
    expect(plantBaselinesDir("visual/pass-unused-face")).toBe("gates/plants/visual/pass-unused-face/tree/storybook/baselines");
  });
});

// Edges the mutation run found unexamined (phase 3): result entries that are no objects or have empty texts, the JSON
// error kept as the cause, a refusing status without its details, the stray finding's directory in the gate's result,
// an import path without "./", and the own stories listed in the --story cause.
describe("visual-verdict: edges", () => {
  it("refuses result entries that are no objects, an empty story and a captured entry with an empty file, and keeps the JSON error", () => {
    for (const item of [null, "x", [], 1]) expect(() => parseResult(JSON.stringify([item]))).toThrow("result.json#0 has no story");
    expect(() => parseResult(JSON.stringify([{ story: "", theme: "light", status: "io" }]))).toThrow("result.json#0 has no story");
    expect(() => parseResult(JSON.stringify([{ story: "a--b", theme: "light", status: "captured", file: "" }]))).toThrow("result.json#0 is captured and names no file");
    const error = ((): unknown => {
      try {
        return parseResult("{");
      } catch (thrown) {
        return thrown;
      }
    })();
    expect((error as Error).cause).toBeInstanceOf(SyntaxError);
  });

  it("names a refusing status without its details with an empty list or message", () => {
    expect(verdictOf(cap("x--y", "light", "io"), cap("x--y", "light"), A)).toEqual({ rule: "io", message: "run-time I/O: " });
    expect(verdictOf(cap("x--y", "light", "render-failed"), cap("x--y", "light"), A)).toEqual({ rule: "render-failed", message: "" });
  });

  it("locates the gate's stray baseline findings in storybook/baselines/", () => {
    const result = visualResult([verdict("a--b", "light", "match")], ["x.png"], "docker+podman");
    expect(result.exit === 1 ? result.findings.map((finding) => finding.location) : result).toEqual([{ path: "storybook/baselines/x.png" }]);
  });

  it("matches an import path without the leading ./ too, and lists every own story in the --story cause", () => {
    expect(ownStories([{ id: "b--c", title: "B", name: "C", importPath: "stories/b.stories.ts" }], ["storybook/stories/b.stories.ts"])).toEqual(["b--c"]);
    expect(plantRequests("visual/pass-x", ["x--a", "x--b"], "x--c")).toEqual({ cause: "--story x--c is not one of the own stories of visual/pass-x (x--a, x--b)" });
  });
});
