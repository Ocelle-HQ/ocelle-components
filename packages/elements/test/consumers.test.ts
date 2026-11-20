import { describe, expect, it } from "vitest";
import "../src/ocelle-status-indicator.ts";
import { inProcessDriver } from "./in-process.ts";
import { consumerScenarios } from "./scenarios/consumers.ts";

// SC-001 (018 spec SC-001; contracts/checks.md § Scenarios; tasks.md T013a, extended by T025 and T036), in process on
// the element source: each body of scenarios/consumers.ts, in light and in dark, renders a consumer's attributes and
// slots with no consumer CSS and reads what they give.
const driver = inProcessDriver();

describe("SC-001: the consumers' attributes and slots have equivalents, with no consumer CSS (in process)", { timeout: 30_000 }, () => {
  for (const theme of ["light", "dark"] as const) {
    it.each(consumerScenarios)(`$name, in ${theme}`, async ({ run, expected }) => {
      expect(await run(driver, theme)).toEqual(expected(theme));
    });
  }
});
