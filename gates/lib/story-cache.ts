// Inputs that identify an isolated phase replay and its browser runtime.
import type { StoryScope } from "./story-selection.ts";
import type { Assertion, StoryEvidenceInput } from "./test-evidence.ts";

interface BrowserFile {
  readonly path: string;
  readonly size: number;
  readonly modified: number;
  readonly version: string;
}

export interface BrowserIdentity {
  readonly browser: BrowserFile;
  readonly headless?: BrowserFile;
}

export interface BrowserProbe {
  bundledChromium(): string;
  file(path: string): Omit<BrowserFile, "version"> & { readonly regular: boolean };
  version(path: string): string;
}

export interface StoryCacheCheck {
  readonly mode: StoryScope["mode"];
  readonly revision: string;
  readonly overlay?: string | undefined;
  readonly expected: readonly Assertion[];
  readonly missingModules: readonly string[];
  readonly selection: Pick<StoryScope, "changed" | "deleted" | "extra"> & {
    readonly changedLines: StoryEvidenceInput["changedLines"];
  };
}

export interface StoryCacheRuntime {
  readonly browser: BrowserIdentity | null;
  readonly environment: NodeJS.ProcessEnv;
  readonly node: string;
  readonly platform: string;
  readonly pnpm: string;
  tree(revision: string): string;
  blob(revision: string, file: string): string;
  runnerFile(path: string): string;
}

export function browserIdentity(_override: string | undefined, _probe: BrowserProbe): BrowserIdentity | null {
  return null;
}

export function checkKey(_check: StoryCacheCheck, _setup: string, _runtime: StoryCacheRuntime): { key: string; reusable: boolean } {
  return { key: "", reusable: false };
}
