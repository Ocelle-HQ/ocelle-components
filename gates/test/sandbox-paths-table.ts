// The rule table of op 023 (#60, acceptance check 1): lines and whether each holds a sandbox path. The in-process test
// (gates/test/sandbox-paths.test.ts) runs it through the gate's rule with `new RegExp`, the integration test
// (gates/test/integration/sandbox-paths.test.ts) through `git grep -E`; both must give these answers. Every sandbox
// path here is built at run time, so this file holds none.

/** `/root/`, built at run time. */
export const rootDir = "/" + "root/";
/** `/home/user/`, built at run time. */
export const homeDir = "/" + "home/user/";
/** pnpm's store in the sandbox. */
export const store = `${rootDir}.local/share/pnpm/store/v10`;
/** The checkout root in the sandbox. */
export const checkout = `${homeDir}ocelle-components`;

/** Each line of the table and whether it matches the rule. */
export const ruleTable: readonly (readonly [string, boolean])[] = [
  [`Content-addressable store is at: ${store}`, true],
  [` RUN  v5.0.5 ${checkout}`, true],
  [`"url": "file://${checkout}/gates/lib/a.ts"`, true],
  [`${rootDir}.cache/ms-playwright`, true],
  [`at ${checkout}/gates/bin/a.ts`, true],
  [`"${checkout}/x"`, true],
  [`(${rootDir}x)`, true],
  [`${rootDir}x`, true],
  ["/work/root/x", false],
  ["gates/test/fixtures/root/x", false],
  ["`/root/`", false],
  ["/root/|", false],
  ["/root/…", false],
  ["/home/user/…", false],
  ["/home/u/x", false],
  ["/home/runner/x", false],
  ["<pnpm store>", false],
  ["file://<repo>/x", false],
  ["<home>/.cache", false],
];
