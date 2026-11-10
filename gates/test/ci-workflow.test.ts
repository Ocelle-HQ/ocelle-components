import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The mutation jobs of the real .github/workflows/ci.yml (contracts/ci-checks.md, research.md R-08 "CI, sharded"):
// `mutation-plan` sets the plan's JSON as its output, and each `mutation-shard` job passes its shard's `files` value
// to `--files` unchanged, so line-range entries `path:start-end` reach the gate as the plan printed them (phase 3
// round 9, O9-01). The value reaches the script through the environment, never pasted into it.
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
      "    timeout-minutes: 10",
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
