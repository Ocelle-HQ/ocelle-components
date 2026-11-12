// A child-process helper of vitest-mutation-config.test.ts (research.md R-05, *Red-first*). It creates Vitest through
// createVitest of vitest/node with the given configuration file, prints one JSON object on stdout and exits.
//
//   node gates/test/integration/vitest-order.ts collect <config>
//     {"modules":[{"project","module"}, ...]}: the test modules the configuration collects, without running them.
//   node gates/test/integration/vitest-order.ts order <config> <project>[,<project>...]
//     {"started":[{"project","module"}, ...]}: the test modules in the order they started, under the options
//     @stryker-mutator/vitest-runner 10.1.1 passes (vitest-test-runner.js:105-140: maxWorkers 1, maxConcurrency 1,
//     bail 1). The run is cancelled as soon as a module of a project outside the given list starts.
//
// Module paths are relative to the repository root, with forward slashes. It runs as its own process so that the
// Vitest it creates shares no state with the Vitest that runs the test.
import { relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createVitest, type Vitest } from "vitest/node";

const repo = fileURLToPath(new URL("../../..", import.meta.url));

interface Started {
  readonly project: string;
  readonly module: string;
}

function modulePath(moduleId: string): string {
  return relative(repo, moduleId).split(sep).join("/");
}

const [mode, config, keepList] = process.argv.slice(2);
if ((mode !== "collect" && mode !== "order") || config === undefined) {
  process.stderr.write("usage: vitest-order.ts collect <config> | order <config> <project>[,<project>...]\n");
  process.exit(2);
}

const keep = new Set((keepList ?? "").split(",").filter((name) => name.length > 0));
const started: Started[] = [];
const run: { vitest?: Vitest; cancelled: boolean } = { cancelled: false };

const reporter = {
  onTestModuleStart(testModule: { readonly moduleId: string; readonly project: { readonly name: string } }): void {
    started.push({ project: testModule.project.name, module: modulePath(testModule.moduleId) });
    if (!keep.has(testModule.project.name) && !run.cancelled) {
      run.cancelled = true;
      void run.vitest?.cancelCurrentRun("keyboard-input");
    }
  },
};

const vitest = await createVitest({
  root: repo,
  config,
  maxWorkers: 1,
  maxConcurrency: 1,
  bail: 1,
  watch: false,
  coverage: { enabled: false },
  includeTaskLocation: true,
  reporters: mode === "order" ? [reporter] : [],
});
run.vitest = vitest;

if (mode === "collect") {
  const specifications = await vitest.globTestSpecifications();
  const modules = specifications.map((spec) => ({ project: spec.project.name, module: modulePath(spec.moduleId) }));
  await vitest.close();
  process.stdout.write(`${JSON.stringify({ modules })}\n`);
} else {
  await vitest.start();
  await vitest.close();
  process.stdout.write(`${JSON.stringify({ started })}\n`);
}
process.exit(0);
