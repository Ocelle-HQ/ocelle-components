// A local HTTP server over a built Storybook's dist/ on 127.0.0.1 (research.md R-04, R-08): the capture and the axe
// gate open the preview through it. servedFile and contentType are pure and tested in process
// (gates/test/storybook-serve.test.ts); serve() is the process boundary.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, posix } from "node:path";

/** The file of `dist` a request path names (query and fragment dropped, `/` the preview), or undefined outside it. */
export function servedFile(dist: string, urlPath: string): string | undefined {
  const path = urlPath.replace(/[?#].*/s, "");
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return undefined;
  }
  if (!decoded.startsWith("/")) return undefined;
  // Normalised as a relative path, so a dot segment that would leave dist stays visible as a leading `..`.
  const inside = posix.normalize(`.${decoded === "/" ? "/iframe.html" : decoded}`);
  if (inside === ".." || inside.startsWith("../")) return undefined;
  return join(dist, inside);
}

const types: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

/** The content type of a served file by its extension. */
export function contentType(path: string): string {
  return types[extname(path)] ?? "application/octet-stream";
}

/** A running server: its origin (`http://127.0.0.1:<port>`) and how to stop it. */
export interface Server {
  readonly origin: string;
  readonly close: () => Promise<void>;
}

/** Serves `dist` on 127.0.0.1 at a free port. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function serve(dist: string): Promise<Server> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const server = createServer((request, response) => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const file = servedFile(dist, request.url ?? "/");
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const missing = (): void => void response.writeHead(404).end();
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    if (file === undefined) {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      missing();
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      return;
    }
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    readFile(file).then((body) => response.writeHead(200, { "content-type": contentType(file) }).end(body), missing);
  });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const { port } = server.address() as AddressInfo;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    origin: `http://127.0.0.1:${String(port)}`,
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    close: () =>
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      new Promise((resolve) => {
        // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        server.close(() => {
          // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 70 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
          resolve();
        });
      }),
  };
}
