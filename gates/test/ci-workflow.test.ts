import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The mutation jobs of the real .github/workflows/ci.yml (contracts/ci-checks.md, research.md R-08 "CI, sharded"):
// `mutation-plan` sets the plan's JSON as its output, and each `mutation-shard` job passes its shard's `files` value
// to `--files` unchanged, so line-range entries `path:start-end` reach the gate as the plan printed them (phase 3
// round 9, O9-01). The value reaches the script through the environment, never pasted into it.
// Op 015 (#35, operator decisions Q1 A to Q3 A, ops/015-mutation-shard-timeout/reviews/triage/operator-decisions.md):
// a shard whose files value names packages/elements/src/ runs under N minutes, every other shard under 10. N = 75, from
// specs/010-feedback-forms operator rounds 6 and 8 (reviews/phase-2/round-6.md O6-01, round-8.md O8-02): element
// shards took 2493–2717 s on run 44354367030, one cancelled at 45 minutes, and 2748 s on this machine
// (reviews/phase-2/mutation.md § O7-01); N exceeds the elements dry-run limit of stryker.elements.config.json.
const workflow = readFileSync(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8");

/** The lines of one job of the workflow, from its key to the line before the next job's key. */
function job(id: string): string[] {
  const lines = workflow.split("\n");
  const start = lines.indexOf(`  ${id}:`);
  const end = lines.findIndex((line, index) => index > start && /^ {2}[\w-]+:/.test(line));
  return lines.slice(start, end);
}

describe("ci.yml mutation jobs (phase 3 round 9, O9-01)", () => {
  it("mutation-plan sets the plan's JSON as the shards output", () => {
    expect(job("mutation-plan").slice(-6)).toEqual([
      "        env:",
      "          BASE: ${{ github.event.pull_request.base.sha }}",
      "        run: |",
      '          shards="$(pnpm --silent run gate:mutation -- --base "$BASE" --plan)"',
      '          echo "$shards"',
      '          echo "shards=$shards" >> "$GITHUB_OUTPUT"',
    ]);
  });

  it("mutation-shard runs one job per planned shard and passes its files value to --files unchanged", () => {
    const shard = job("mutation-shard");
    expect(shard.slice(0, 10)).toEqual([
      "  mutation-shard:",
      "    name: Mutation shard",
      "    needs: mutation-plan",
      "    if: needs.mutation-plan.outputs.shards != '[]'",
      "    runs-on: ubuntu-24.04",
      "    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && 75 || 10 }}",
      "    strategy:",
      "      fail-fast: false",
      "      matrix:",
      "        shard: ${{ fromJSON(needs.mutation-plan.outputs.shards) }}",
    ]);
    expect(shard.slice(-4)).toEqual([
      "      - env:",
      "          BASE: ${{ github.event.pull_request.base.sha }}",
      "          FILES: ${{ matrix.shard.files }}",
      '        run: pnpm run gate:mutation -- --base "$BASE" --files "$FILES"',
    ]);
  });

  it("mutation-shard gives a shard with element source a limit of exactly 75 minutes (010 operator rounds 6 and 8), 10 to the others, above the elements dry-run limit (op 015)", () => {
    const limitLine = /^ {4}timeout-minutes: \$\{\{ contains\(matrix\.shard\.files, 'packages\/elements\/src\/'\) && ([1-9]\d*) \|\| ([1-9]\d*) \}\}$/;
    const matches = job("mutation-shard")
      .map((line) => limitLine.exec(line))
      .filter((match) => match !== null);
    expect(matches).toHaveLength(1);
    const minutes = Number(matches[0]?.[1]);
    const elements = JSON.parse(readFileSync(new URL("../../stryker.elements.config.json", import.meta.url), "utf8")) as { dryRunTimeoutMinutes: unknown };
    expect(typeof elements.dryRunTimeoutMinutes).toBe("number");
    expect(minutes).toBe(75);
    expect(Number(matches[0]?.[2])).toBe(10);
    expect(minutes).toBeGreaterThan(elements.dryRunTimeoutMinutes as number);
  });
});

// 006 FR-017 and US1 scenario 6 (contracts/gates.md § `storybook-build`): the job `storybook-build`, named "Storybook
// build", checks out, sets up and runs the gate, nothing else (the gate builds the Storybook itself; the packages need
// no build first, research.md R-09).
describe("ci.yml storybook-build job (006 FR-017)", () => {
  it("is named Storybook build and runs pnpm run gate:storybook-build after checkout and setup", () => {
    expect(job("storybook-build")).toEqual([
      "  storybook-build:",
      "    name: Storybook build",
      "    runs-on: ubuntu-24.04",
      "    steps:",
      "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
      "        with:",
      "          persist-credentials: false",
      "      - uses: ./.github/actions/setup",
      "      - run: pnpm run gate:storybook-build",
    ]);
  });
});

// 006 FR-017 and US3 scenario 7 (contracts/gates.md § `axe`, § The registry): the job `axe`, named "Accessibility",
// checks out, sets up (which installs Playwright's Chromium, the host browser axe runs in, research.md R-08) and runs
// the gate, nothing else: the gate builds the Storybook itself.
describe("ci.yml axe job (006 FR-017)", () => {
  it("is named Accessibility and runs pnpm run gate:axe after checkout and setup", () => {
    expect(job("axe")).toEqual([
      "  axe:",
      "    name: Accessibility",
      "    runs-on: ubuntu-24.04",
      "    steps:",
      "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
      "        with:",
      "          persist-credentials: false",
      "      - uses: ./.github/actions/setup",
      "      - run: pnpm run gate:axe",
    ]);
  });
});

// Op 023 (#60, FR-004; plan.md *Files to change*): the job `sandbox-paths`, named "Sandbox paths", has the shape of
// config-copies: it checks out without persisted credentials, sets up and runs the gate, nothing else.
describe("ci.yml sandbox-paths job (op 023)", () => {
  it("is named Sandbox paths and runs pnpm run gate:sandbox-paths after checkout and setup", () => {
    expect(job("sandbox-paths")).toEqual([
      "  sandbox-paths:",
      "    name: Sandbox paths",
      "    runs-on: ubuntu-24.04",
      "    steps:",
      "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
      "        with:",
      "          persist-credentials: false",
      "      - uses: ./.github/actions/setup",
      "      - run: pnpm run gate:sandbox-paths",
    ]);
  });
});

// 006 FR-017, FR-018, FR-026 and US2 scenario 12 (contracts/gates.md § `visual`, § The registry; research.md R-07, R-11):
// the job `visual`, named "Visual regression", runs the gate under both engines, records the runner's free disk after
// both pulls, and uploads storybook/.visual/ (the captures in baseline layout among it) when it fails; the Plants job
// gives every visual plant both engines and uploads the failing pass plants' captures, storybook/.visual/plants/. The
// upload action is pinned by commit SHA and includes the hidden .visual directory.
const upload = "actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2";
const setup = [
  "    runs-on: ubuntu-24.04",
  "    steps:",
  "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
  "        with:",
  "          persist-credentials: false",
  "      - uses: ./.github/actions/setup",
];

// Plan decisions 22, 25 and 27 (operator decisions 2026-11-11, "Add the CI step" and "Apply now", and 2026-11-12, "Add
// the tag read"; contracts/gates.md § The registry; contracts/container.md § The pin record): the gate removes docker's
// copy after run 1; after the gate passes, the job records skopeo's version, skopeo's raw manifest of the pin, podman's
// inspect output of the pin and skopeo's raw index of the tag, the image, digest and tag read from container.json, and
// uploads them as the artifact pin-record.
const pinRecord = [
  "      - run: |",
  '          reference="$(node -p \'const pin = require("./storybook/visual/container.json"); `${pin.image}@${pin.digest}`\')"',
  '          tag="$(node -p \'const pin = require("./storybook/visual/container.json"); `${pin.image}:${pin.tag}`\')"',
  '          record="$RUNNER_TEMP/pin-record"',
  '          mkdir -p "$record"',
  '          skopeo --version > "$record/skopeo-version.txt"',
  '          skopeo inspect --raw "docker://$reference" > "$record/skopeo-inspect-raw-manifest.json"',
  '          podman image inspect "$reference" > "$record/podman-inspect.json"',
  '          skopeo inspect --raw "docker://$tag" > "$record/skopeo-inspect-raw-index.json"',
  `      - uses: ${upload}`,
  "        with:",
  "          name: pin-record",
  "          path: ${{ runner.temp }}/pin-record/",
];

describe("ci.yml visual and plants jobs (006 FR-017, FR-018)", () => {
  it("visual is named Visual regression, runs the gate with --engine both, and uploads storybook/.visual/ on failure", () => {
    expect(job("visual")).toEqual([
      "  visual:",
      "    name: Visual regression",
      ...setup,
      "      - run: pnpm run gate:visual -- --engine both --remove-docker-image",
      ...pinRecord,
      "      - if: always()",
      "        run: df -h /",
      "      - if: failure()",
      `        uses: ${upload}`,
      "        with:",
      "          name: visual",
      "          path: storybook/.visual/",
      "          include-hidden-files: true",
    ]);
  });

  // Plan decisions 23 and 25 (operator decisions 2026-11-11, "In phase 3 now" and "Apply now"; contracts/gates.md § The
  // registry): the plant job split into the plan, a matrix of shards (each first removing the runner's unused toolsets)
  // and the Plants check, which downloads every shard's report and gives the verdict.
  it("plants-plan prints the plan as the shards output", () => {
    expect(job("plants-plan")).toEqual([
      "  plants-plan:",
      "    name: Plants plan",
      "    runs-on: ubuntu-24.04",
      "    outputs:",
      "      shards: ${{ steps.plan.outputs.shards }}",
      "    steps:",
      ...setup.slice(2),
      "      - id: plan",
      "        run: |",
      '          shards="$(pnpm --silent run gate:plants -- --plan)"',
      '          echo "$shards"',
      '          echo "shards=$shards" >> "$GITHUB_OUTPUT"',
    ]);
  });

  // Plan decision 28 (operator decision 2026-11-12, "Measure disk, then B'"): the free disk before the toolset removal too.
  it("plants-shard prints the free disk before and after the toolset removal, judges one planned shard under both engines, and uploads its report always", () => {
    expect(job("plants-shard")).toEqual([
      "  plants-shard:",
      "    name: Plants shard",
      "    needs: plants-plan",
      "    runs-on: ubuntu-24.04",
      "    strategy:",
      "      fail-fast: false",
      "      matrix:",
      "        shard: ${{ fromJSON(needs.plants-plan.outputs.shards) }}",
      "    steps:",
      "      - run: df -h /",
      "      - run: sudo rm -rf /usr/local/lib/android /usr/share/dotnet /opt/ghc /usr/local/.ghcup /opt/hostedtoolcache/CodeQL",
      "      - run: df -h /",
      ...setup.slice(2),
      "      - env:",
      "          OCELLE_VISUAL_ENGINE: both",
      "          SHARD: ${{ matrix.shard }}",
      '        run: pnpm run gate:plants -- --shard "$SHARD"',
      "      - if: always()",
      "        run: df -h /",
      "      - if: always()",
      `        uses: ${upload}`,
      "        with:",
      "          name: plant-shard-${{ matrix.shard }}",
      "          path: storybook/.visual/plant-shards/",
      "          include-hidden-files: true",
      "      - if: failure()",
      `        uses: ${upload}`,
      "        with:",
      "          name: plants-${{ matrix.shard }}",
      "          path: storybook/.visual/plants/",
      "          include-hidden-files: true",
    ]);
  });

  it("plants, named Plants, downloads every shard's report after the shards, always, and gives the verdict", () => {
    expect(job("plants")).toEqual([
      "  plants:",
      "    name: Plants",
      "    needs: [plants-plan, plants-shard]",
      "    if: always()",
      ...setup,
      "      - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2",
      "        with:",
      "          pattern: plant-shard-*",
      "          path: storybook/.visual/plant-shards/",
      "          merge-multiple: true",
      "      - run: pnpm run gate:plants -- --verdict storybook/.visual/plant-shards",
    ]);
  });
});

// 006 FR-020 (research.md R-10; spec § Assumptions, "Build in other jobs"): the `csp` job builds the packages only,
// since the gate reads no Storybook file; the `prefix` job still builds the whole workspace, Storybook included, since
// the prefix gate reads the HTML entries storybook/dist/*.html (FR-022).
describe("ci.yml csp and prefix jobs (006 FR-020, FR-022)", () => {
  const steps = (id: string): string[] => job(id).filter((line) => line.startsWith("      - run: "));

  it("builds the packages only before the csp gate, and the whole workspace before the prefix gate", () => {
    expect(steps("csp")).toEqual(['      - run: pnpm --filter "./packages/*" -r build && pnpm run gate:csp']);
    expect(steps("prefix")).toEqual(["      - run: pnpm -r build && pnpm run gate:prefix"]);
  });
});

describe("ci.yml full Unit tests gate", () => {
  it("requires both discovered inventory and successful shards for the existing check", () => {
    const fullVerdict = job("unit-tests").join("\n");
    const verdict = fullVerdict.replace(", unit-tests-full]", "]");
    expect(verdict).toContain("name: Unit tests");
    expect(verdict).toContain("needs: [unit-tests-plan, unit-tests-shard]");
    expect(fullVerdict).toContain("needs: [unit-tests-plan, unit-tests-shard, unit-tests-full]");
    expect(verdict).toContain("if: always()");
    expect(verdict).toContain('test "$PLAN" = success');
    expect(verdict).toContain('test "$SHARDS" = success');
    expect(verdict).toContain("gates/bin/test-shards.ts verify");
  });
});
