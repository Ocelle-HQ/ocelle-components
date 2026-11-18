import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { beforeUpgrade, beforeUpgradeExpected, beforeUpgradeMarkup } from "./scenarios/data-table.ts";

// Before upgrade (019 US1 edge case; contracts/styles-data-table.md § Block 1; tasks.md T009), in process: this file
// never imports src/ocelle-data-table.ts, so in its own iframe (Vitest browser mode, isolate on) the tag stays undefined
// and the table is styled by `@ocelle/styles`' block 1 alone, with no region. The fixture runs the same body on
// data-table-upgrade.html, which loads no element script (test/browser/data-table.test.ts).
const driver = inProcessDriver();

describe("ocelle-data-table before upgrade, in process (US1)", () => {
  it("before upgrade: the table is styled by block 1 (compact cells, eyebrow headers) with no region", async () => {
    await driver.mount(beforeUpgradeMarkup, { base: true });
    expect(await beforeUpgrade(driver)).toEqual(beforeUpgradeExpected);
  });
});
