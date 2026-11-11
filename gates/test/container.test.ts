import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { engineFamily, enginesText, inspectProblem, mediaTypeProblem, parsePin, pinCommands, pinReference, referenceProblem, resolveEngine, runArgs, runDir } from "../lib/container.ts";
import type { Pin, RunInput } from "../lib/container.ts";

// The pinned container on the host (FR-007, FR-009, FR-026; contracts/container.md; research.md R-06): engine
// resolution with the CI rule, the pin check on recorded docker (containerd store) outputs of the phase 1 spike and on
// outputs written from the documented formats of docker's classic store and of podman (gates/test/fixtures/container/
// README.md), and the run arguments. Every expected value is written from contracts/container.md.
const fixture = (name: string): string => readFileSync(new URL(`fixtures/container/${name}`, import.meta.url), "utf8");
const digest = "sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0";
const other = "sha256:f609973e8fd93f38a5ddfd706a65805294247dae8d81b2541c0afe2787746197";
const reference = `mcr.microsoft.com/playwright@${digest}`;
const pin: Pin = { image: "mcr.microsoft.com/playwright", digest, platform: "linux/amd64", tag: "v1.64.1-noble", node: "26.13.0", browser: "chromium_headless_shell-1248" };

describe("parsePin", () => {
  it("reads storybook/visual/container.json", () => {
    expect(parsePin(readFileSync(new URL("../../storybook/visual/container.json", import.meta.url), "utf8"))).toEqual(pin);
  });

  it("names a field that is missing or not text, and a text that is not a JSON object", () => {
    expect(() => parsePin(JSON.stringify({ ...pin, browser: 1 }))).toThrow("storybook/visual/container.json: browser must be a non-empty string");
    expect(() => parsePin(JSON.stringify({ ...pin, digest: undefined }))).toThrow("storybook/visual/container.json: digest must be a non-empty string");
    expect(() => parsePin("[]")).toThrow("storybook/visual/container.json is not a JSON object");
    expect(() => parsePin("{")).toThrow("storybook/visual/container.json is not valid JSON");
  });
});

describe("resolveEngine (contracts/container.md § Engine resolution)", () => {
  const has =
    (...names: string[]) =>
    (name: string): boolean =>
      names.includes(name);
  const ci = "in CI the visual gate runs under both docker and podman";

  it("auto: docker if available, else podman, else exit 2", () => {
    expect(resolveEngine("auto", {}, has("docker", "podman"))).toEqual({ kind: "engines", engines: ["docker", "docker"] });
    expect(resolveEngine("auto", {}, has("podman", "skopeo"))).toEqual({ kind: "engines", engines: ["podman", "podman"] });
    expect(resolveEngine("auto", {}, has())).toEqual({ kind: "error", cause: "no container engine (docker or podman) is available" });
  });

  it("both: docker for run 1, podman for run 2, naming a missing one", () => {
    expect(resolveEngine("both", {}, has("docker", "podman", "skopeo"))).toEqual({ kind: "engines", engines: ["docker", "podman"] });
    expect(resolveEngine("both", {}, has("docker"))).toEqual({ kind: "error", cause: "no container engine: podman not found" });
    expect(resolveEngine("both", {}, has("podman"))).toEqual({ kind: "error", cause: "no container engine: docker not found" });
  });

  it("a name: both runs under it when found, else exit 2 naming it; host: the capture on the host", () => {
    expect(resolveEngine("docker", {}, has("docker"))).toEqual({ kind: "engines", engines: ["docker", "docker"] });
    expect(resolveEngine("podman", {}, has("podman", "docker", "skopeo"))).toEqual({ kind: "engines", engines: ["podman", "podman"] });
    expect(resolveEngine("/opt/bin/nerdctl", {}, has("/opt/bin/nerdctl"))).toEqual({ kind: "engines", engines: ["/opt/bin/nerdctl", "/opt/bin/nerdctl"] });
    expect(resolveEngine("ocelle-no-such-engine", {}, has("docker"))).toEqual({ kind: "error", cause: "no container engine: ocelle-no-such-engine not found" });
    expect(resolveEngine("host", {}, has())).toEqual({ kind: "host" });
  });

  it.each(["CI", "GITHUB_ACTIONS"])("with %s=true: auto becomes both, a single engine found is refused, both, host and a name not found unchanged", (variable) => {
    const env = { [variable]: "true" };
    expect(resolveEngine("auto", env, has("docker", "podman", "skopeo"))).toEqual({ kind: "engines", engines: ["docker", "podman"] });
    expect(resolveEngine("auto", env, has("docker"))).toEqual({ kind: "error", cause: "no container engine: podman not found" });
    expect(resolveEngine("docker", env, has("docker", "podman"))).toEqual({ kind: "error", cause: ci });
    expect(resolveEngine("podman", env, has("docker", "podman"))).toEqual({ kind: "error", cause: ci });
    expect(resolveEngine("/opt/bin/nerdctl", env, has("/opt/bin/nerdctl"))).toEqual({ kind: "error", cause: ci });
    expect(resolveEngine("both", env, has("docker", "podman", "skopeo"))).toEqual({ kind: "engines", engines: ["docker", "podman"] });
    expect(resolveEngine("host", env, has("docker", "podman"))).toEqual({ kind: "host" });
    expect(resolveEngine("ocelle-no-such-engine", env, has("docker", "podman"))).toEqual({ kind: "error", cause: "no container engine: ocelle-no-such-engine not found" });
  });

  it("takes only true as true: CI=false, CI=1 and an empty CI keep a single engine", () => {
    for (const value of ["false", "1", ""]) {
      expect(resolveEngine("docker", { CI: value, GITHUB_ACTIONS: value }, has("docker", "podman"))).toEqual({ kind: "engines", engines: ["docker", "docker"] });
    }
  });
});

// Plan decision 21 (operator decision 2026-11-11, on CI run 43064614842): podman refuses to read the pin's single
// image manifest with `podman manifest inspect`, so under podman the pin check reads the media type with skopeo. A
// resolution that runs any capture under podman needs skopeo on PATH, checked here, before any engine command; the
// expectations above that resolve to podman now list skopeo among the tools found (they stood for podman's reader).
describe("resolveEngine: skopeo for podman's pin check (plan decision 21)", () => {
  const has =
    (...names: string[]) =>
    (name: string): boolean =>
      names.includes(name);
  const skopeo = { kind: "error", cause: "the pin check under podman needs skopeo: skopeo not found" };

  it("refuses podman, both and auto falling back to podman without skopeo", () => {
    expect(resolveEngine("podman", {}, has("podman", "docker"))).toEqual(skopeo);
    expect(resolveEngine("/usr/bin/podman", {}, has("/usr/bin/podman"))).toEqual(skopeo);
    expect(resolveEngine("both", {}, has("docker", "podman"))).toEqual(skopeo);
    expect(resolveEngine("auto", {}, has("podman"))).toEqual(skopeo);
    expect(resolveEngine("auto", { CI: "true" }, has("docker", "podman"))).toEqual(skopeo);
  });

  it("lets docker alone and the host run without skopeo, and podman or both with it", () => {
    expect(resolveEngine("docker", {}, has("docker"))).toEqual({ kind: "engines", engines: ["docker", "docker"] });
    expect(resolveEngine("auto", {}, has("docker", "podman"))).toEqual({ kind: "engines", engines: ["docker", "docker"] });
    expect(resolveEngine("host", {}, has())).toEqual({ kind: "host" });
    expect(resolveEngine("podman", {}, has("podman", "skopeo"))).toEqual({ kind: "engines", engines: ["podman", "podman"] });
    expect(resolveEngine("both", {}, has("docker", "podman", "skopeo"))).toEqual({ kind: "engines", engines: ["docker", "podman"] });
  });

  it("names a missing engine and the CI rule before skopeo", () => {
    expect(resolveEngine("both", {}, has("docker"))).toEqual({ kind: "error", cause: "no container engine: podman not found" });
    expect(resolveEngine("podman", { CI: "true" }, has("podman"))).toEqual({ kind: "error", cause: "in CI the visual gate runs under both docker and podman" });
  });
});

describe("enginesText", () => {
  it("is docker+podman for two engines, else the one engine and that no cross-engine comparison was made", () => {
    expect(enginesText(["docker", "podman"])).toBe("docker+podman");
    expect(enginesText(["docker", "docker"])).toBe("docker only: no cross-engine comparison");
    expect(enginesText(["podman", "podman"])).toBe("podman only: no cross-engine comparison");
  });
});

describe("the pin's form (contracts/container.md § The pin check, reference form)", () => {
  it("is pulled and run only by <image>@<digest>", () => {
    expect(pinReference(pin)).toBe(reference);
    expect(referenceProblem(pin)).toBeUndefined();
  });

  it("refuses a tag, a digest of another form and another platform", () => {
    expect(referenceProblem({ ...pin, digest: "v1.64.1-noble" })).toBe("not pinned by digest: v1.64.1-noble");
    expect(referenceProblem({ ...pin, digest: digest.toUpperCase().replace("SHA256", "sha256") })).toMatch(/^not pinned by digest/);
    expect(referenceProblem({ ...pin, digest: digest.slice(0, -1) })).toMatch(/^not pinned by digest/);
    expect(referenceProblem({ ...pin, digest: `${digest}0` })).toMatch(/^not pinned by digest/);
    expect(referenceProblem({ ...pin, digest: `x${digest}` })).toMatch(/^not pinned by digest/);
    expect(referenceProblem({ ...pin, platform: "linux/arm64" })).toBe("the pin names platform linux/arm64, not linux/amd64");
  });
});

describe("pinCommands and engineFamily", () => {
  it("builds docker's and podman's commands of the pin check", () => {
    expect(pinCommands("docker", pin)).toEqual({
      mediaType: ["docker", "buildx", "imagetools", "inspect", "--raw", reference],
      pull: ["docker", "pull", "--platform", "linux/amd64", reference],
      inspect: ["docker", "image", "inspect", reference],
    });
    expect(pinCommands("/usr/bin/podman", pin)).toEqual({
      mediaType: ["skopeo", "inspect", "--raw", `docker://${reference}`],
      pull: ["/usr/bin/podman", "pull", "--platform", "linux/amd64", reference],
      inspect: ["/usr/bin/podman", "image", "inspect", reference],
    });
  });

  it("is podman for a name whose base name holds podman, else docker", () => {
    expect(["podman", "/usr/bin/podman", "podman-remote", "docker", "/opt/bin/nerdctl", "/podman/docker"].map(engineFamily)).toEqual(["podman", "podman", "podman", "docker", "docker", "docker"]);
  });
});

describe("mediaTypeProblem (the reference's media type, from the registry)", () => {
  const index = "the pin names an index, not the linux/amd64 manifest";

  it("accepts an image manifest: docker's imagetools output and skopeo's raw manifest (podman's reader)", () => {
    expect(mediaTypeProblem(fixture("docker-imagetools-manifest.json"))).toBeUndefined();
    expect(mediaTypeProblem(fixture("skopeo-inspect-raw-manifest.json"))).toBeUndefined();
    expect(mediaTypeProblem(JSON.stringify({ mediaType: "application/vnd.docker.distribution.manifest.v2+json" }))).toBeUndefined();
  });

  it("refuses an OCI index (the tag's, recorded) and a docker manifest list, for each engine's output", () => {
    expect(mediaTypeProblem(fixture("docker-imagetools-tag-index.json"))).toBe(index);
    expect(mediaTypeProblem(fixture("skopeo-inspect-raw-index.json"))).toBe(index);
    expect(mediaTypeProblem(JSON.stringify({ mediaType: "application/vnd.docker.distribution.manifest.list.v2+json", manifests: [] }))).toBe(index);
  });

  it("refuses an output that is not JSON or names no media type", () => {
    expect(mediaTypeProblem("no such manifest")).toBe("the registry's manifest of the pin is not JSON");
    expect(mediaTypeProblem(JSON.stringify({ schemaVersion: 2 }))).toBe("the registry's manifest of the pin has no media type");
  });
});

describe("inspectProblem (the pulled image's identity: RepoDigests, Os, Architecture; never .Id)", () => {
  const mismatch = (field: string): string => `the pulled image does not match the pin: ${field}`;
  /** The fixture's one inspect object with fields replaced. */
  const edited = (name: string, fields: Record<string, unknown>): string => {
    const [image] = JSON.parse(fixture(name)) as Record<string, unknown>[];
    return JSON.stringify([{ ...image, ...fields }]);
  };

  it.each([
    ["docker", "docker-containerd-inspect.json"],
    ["docker", "docker-classic-inspect.json"],
    ["podman", "podman-inspect.json"],
  ])("%s %s: a match, a wrong digest, an arm64 image, another Os", (engine, name) => {
    expect(inspectProblem(engine, fixture(name), pin)).toBeUndefined();
    expect(inspectProblem(engine, edited(name, { RepoDigests: [`mcr.microsoft.com/playwright@${other}`] }), pin)).toBe(mismatch("RepoDigests"));
    expect(inspectProblem(engine, edited(name, { RepoDigests: [`mcr.microsoft.com/other@${digest}`] }), pin)).toBe(mismatch("RepoDigests"));
    expect(inspectProblem(engine, edited(name, { Architecture: "arm64" }), pin)).toBe(mismatch("Architecture"));
    expect(inspectProblem(engine, edited(name, { Os: "windows" }), pin)).toBe(mismatch("Os"));
  });

  it("never compares .Id: the containerd store's manifest digest, the classic store's and podman's config digest, or any other", () => {
    expect(JSON.parse(fixture("docker-classic-inspect.json"))).toMatchObject([{ Id: "sha256:a0d7b2b49ffa0e99787a00b7ec2af46eca58020082713f002ca9f0f1cfd1a017" }]);
    expect(inspectProblem("docker", edited("docker-containerd-inspect.json", { Id: other }), pin)).toBeUndefined();
    expect(inspectProblem("podman", edited("podman-inspect.json", { Id: "0".repeat(64) }), pin)).toBeUndefined();
  });

  it("checks podman's .Digest besides its RepoDigests", () => {
    expect(inspectProblem("podman", edited("podman-inspect.json", { Digest: other }), pin)).toBe(mismatch("Digest"));
    expect(inspectProblem("docker", edited("docker-classic-inspect.json", { Digest: other }), pin)).toBeUndefined();
  });

  it("refuses an output that is not one image", () => {
    expect(inspectProblem("docker", "Error: No such image", pin)).toBe("the image inspect output of docker is not readable");
    expect(inspectProblem("podman", "[]", pin)).toBe("the image inspect output of podman is not readable");
    expect(inspectProblem("docker", "{}", pin)).toBe("the image inspect output of docker is not readable");
  });
});

describe("runArgs (contracts/container.md § Run arguments)", () => {
  const input: RunInput = { engine: "docker", repo: "/work/repo", root: "/work/repo", run: 1, uid: 1000, gid: 1001, pin };

  it("docker, root equal to the repository: the user, the repository read-only and only the run directory writable", () => {
    expect(runDir("/work/repo", 1)).toBe("/work/repo/storybook/.visual/run-1");
    expect(runArgs(input)).toEqual([
      "run",
      "--rm",
      "--platform",
      "linux/amd64",
      "--network",
      "none",
      "--user",
      "1000:1001",
      "-v",
      "/work/repo:/work/repo:ro",
      "-v",
      "/work/repo/storybook/.visual/run-1:/work/repo/storybook/.visual/run-1",
      "-e",
      "HOME=/work/repo/storybook/.visual/run-1/home",
      "-e",
      `OCELLE_VISUAL_PIN=${digest}`,
      "-w",
      "/work/repo",
      reference,
      "node",
      "/work/repo/gates/visual/capture.ts",
      "/work/repo/storybook/.visual/run-1/request.json",
    ]);
  });

  it("podman, root different from the repository: keep-id, and the root mounted read-only too", () => {
    expect(runArgs({ ...input, engine: "/usr/bin/podman", root: "/tmp/plant", run: 2 })).toEqual([
      "run",
      "--rm",
      "--platform",
      "linux/amd64",
      "--network",
      "none",
      "--userns=keep-id",
      "-v",
      "/work/repo:/work/repo:ro",
      "-v",
      "/tmp/plant:/tmp/plant:ro",
      "-v",
      "/tmp/plant/storybook/.visual/run-2:/tmp/plant/storybook/.visual/run-2",
      "-e",
      "HOME=/tmp/plant/storybook/.visual/run-2/home",
      "-e",
      `OCELLE_VISUAL_PIN=${digest}`,
      "-w",
      "/work/repo",
      reference,
      "node",
      "/work/repo/gates/visual/capture.ts",
      "/tmp/plant/storybook/.visual/run-2/request.json",
    ]);
  });
});

// Edges the mutation run found unexamined (phase 3): pins that are no objects or have empty fields, the JSON error kept
// as the cause, an empty media type, and inspect outputs that are not one image or have no list of RepoDigests.
describe("container: edges", () => {
  it("refuses a pin that is null, a number, or has an empty field, and keeps the JSON error", () => {
    expect(() => parsePin("null")).toThrow("storybook/visual/container.json is not a JSON object");
    expect(() => parsePin("1")).toThrow("storybook/visual/container.json is not a JSON object");
    expect(() => parsePin(JSON.stringify({ ...pin, node: "" }))).toThrow("storybook/visual/container.json: node must be a non-empty string");
    const error = ((): unknown => {
      try {
        return parsePin("{");
      } catch (thrown) {
        return thrown;
      }
    })();
    expect((error as Error).cause).toBeInstanceOf(SyntaxError);
  });

  it("refuses an empty media type, an inspect output of no single object, and RepoDigests that are no list", () => {
    expect(mediaTypeProblem(JSON.stringify({ mediaType: "" }))).toBe("the registry's manifest of the pin has no media type");
    for (const output of ["[null]", "[1]", "[{},{}]", "[[]]"]) expect(inspectProblem("docker", output, pin)).toBe("the image inspect output of docker is not readable");
    const [image] = JSON.parse(fixture("docker-containerd-inspect.json")) as Record<string, unknown>[];
    expect(inspectProblem("docker", JSON.stringify([{ ...image, RepoDigests: undefined }]), pin)).toBe("the pulled image does not match the pin: RepoDigests");
    expect(inspectProblem("docker", JSON.stringify([{ ...image, RepoDigests: reference }]), pin)).toBe("the pulled image does not match the pin: RepoDigests");
  });
});
