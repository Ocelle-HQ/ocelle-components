// A local HTTP server over a built Storybook's dist/ on 127.0.0.1 (research.md R-04, R-08): the capture and the axe
// gate open the preview through it. servedFile and contentType are pure and tested in process
// (gates/test/storybook-serve.test.ts); serve() is the process boundary.

/** The file of `dist` a request path names (query and fragment dropped, `/` the preview), or undefined outside it. */
export function servedFile(dist: string, urlPath: string): string | undefined {
  throw new Error(`not implemented (storybook-serve, phase 3): ${dist} ${urlPath}`);
}

/** The content type of a served file by its extension. */
export function contentType(path: string): string {
  throw new Error(`not implemented (storybook-serve, phase 3): ${path}`);
}

/** A running server: its origin (`http://127.0.0.1:<port>`) and how to stop it. */
export interface Server {
  readonly origin: string;
  readonly close: () => Promise<void>;
}

/** Serves `dist` on 127.0.0.1 at a free port. */
export function serve(dist: string): Promise<Server> {
  throw new Error(`not implemented (storybook-serve, phase 3): ${dist}`);
}
