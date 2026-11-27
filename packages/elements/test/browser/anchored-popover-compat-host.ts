import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAnchoredPopoverFixture } from "./global-setup.ts";
import { serve } from "./serve.ts";
import type { Served } from "./serve.ts";

const dir = await mkdtemp(join(tmpdir(), "ocelle-popover-compat-"));
let server: Served | undefined;
try {
  if (!(await buildAnchoredPopoverFixture(dir))) throw new Error("the isolated popover package entry was not emitted");
  server = await serve({ dir });
  console.log(`${server.origin}/anchored-popover.html`);
  await new Promise<void>((resolve) => {
    process.once("SIGINT", () => { resolve(); });
    process.once("SIGTERM", () => { resolve(); });
  });
} finally {
  await server?.close();
  await rm(dir, { recursive: true, force: true });
}
