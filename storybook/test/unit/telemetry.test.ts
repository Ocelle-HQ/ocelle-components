import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../../.storybook/main.ts";

// No network at build (FR-023, research.md R-10, PLAN-A11Y-SECURITY-1-008; T034): Storybook's telemetry is disabled
// in main.ts and by the build script's flag, and the build is one command that generates the token and swatch
// stylesheets first and externalises the HTML entries last (reviews/phase-3/spike.md). It builds the preview only,
// with no manager UI (operator decision R1-01, 2026-11-04; research.md R-10 *Preview only*).
interface Manifest {
  readonly scripts?: Readonly<Record<string, string>>;
}

const manifest = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as Manifest;

describe("Storybook telemetry", () => {
  it("is disabled in main.ts", () => {
    expect(config.core).toEqual({ disableTelemetry: true });
  });

  it("is disabled by the build script, which builds the preview only, generates first and externalises the HTML entries last", () => {
    expect(manifest.scripts).toEqual({
      prebuild: "node scripts/swatches.ts",
      build: "pnpm run prebuild && storybook build --disable-telemetry --preview-only -c .storybook -o dist && node scripts/externalise.ts dist",
    });
  });
});
