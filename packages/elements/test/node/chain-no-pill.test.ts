import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The chain is the chain's own, not the pill tag (019 FR-035, US3-4; #517; constitution II; tasks.md T058): the
// chain's and the step's source and styles contain no `pill`, so no `ocelle-pill-tag`, no `--ocelle-radius-pill` and
// no pill part or hook is imported, read or drawn. Paired with a positive read: each file exists and holds its
// `@tagname` and the chip's own radius token.
const read = (path: string): string => {
  const url = new URL(path, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
};
const chain = read("../../src/ocelle-evidence-chain.ts");
const step = read("../../src/ocelle-evidence-step.ts");

describe("the evidence chain draws nothing of the pill tag (FR-035)", () => {
  it("ocelle-evidence-chain.ts and ocelle-evidence-step.ts exist and hold their @tagname, the chain's styles name --ocelle-radius-2 for the chip, and neither file contains pill in any case", () => {
    expect({
      tags: [/@tagname ocelle-evidence-chain\b/.test(chain), /@tagname ocelle-evidence-step\b/.test(step)],
      radius: /::slotted\(ocelle-evidence-step\[variant="chip"\]\)\s*\{[^}]*border-radius:\s*var\(--ocelle-radius-2\)/.test(chain),
      pill: [/pill/i.test(chain), /pill/i.test(step)],
    }).toEqual({ tags: [true, true], radius: true, pill: [false, false] });
  });
});
