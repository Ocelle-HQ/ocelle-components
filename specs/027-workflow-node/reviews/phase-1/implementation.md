# Phase 1 implementation evidence

- Base: `88702025e56654ceb479d468ad0a565f23ea4f76`
- Inert scaffold: `d8c041a765ff818340c8bcc79e8ee41450a6e804`, with no test edits
- Test-only red: `a5ffb1ca6f954b39c5effe848f3a1ea03a85e51a`

`red.sh 1 phase` recorded 19 named assertion failures across the two Chromium harnesses in 16.465 seconds
(16.775 seconds wall). The scaffold rendered no native action. Title, selection, focus and style cases failed
at their null-safe assertions. The exact exports and manifest inventories passed. The retained red log shows
the four selected project/file identities.

The built green checks use the same pointer input function as the in-process browser commands. The test's
case names and assertions are unchanged. Playwright receives the existing update commands with literal types
so the fixture also passes TypeScript's overload check.

The final in-process suite registers through the package root. On the pre-scaffold base, Vitest browser
mode reduced the standalone import failure to a generic file-load error. Loading the existing package
root lets the base run the same named assertions without the workflow node. The scaffold and green
head still load the same source module through that registration path.

Security review, planning, selected and focused each have a light and dark baseline. All eight captures
matched byte for byte across two runs of the repository's capture library, using its pinned Docker image.

## Local focused replay

At `2977ce1357fd06e1bcc53bc088b789d0fcce5a22`, `tdd-check.sh 1` verified all 19 named assertions
on the red commit, pre-scaffold base and scaffold, then verified green at the implementation head.
The first check took 57.003 seconds wall and reused the recorded red stage. The unchanged repeat took
1.176 seconds wall and reused all four stages with the same project and file identities.

| Project | File | Stages |
| --- | --- | --- |
| elements (chromium) | `packages/elements/test/workflow-node.test.ts` | Red, base, scaffold, head |
| elements-browser | `packages/elements/test/browser/workflow-node.test.ts` | Red, base, scaffold, head |
| elements (chromium) | `packages/elements/test/exports.test.ts` | Red, head |
| elements-node | `packages/elements/test/node/manifest.test.ts` | Red, head |
| elements-node | `packages/elements/test/node/readme.test.ts` | Head |
| gates | `gates/test/manifest.test.ts` | Head |
| gates-integration | `gates/test/integration/manifest.test.ts` | Head |

## Affected Plants

```text
$ pnpm run gate:plants -- --affected 88702025e56654ceb479d468ad0a565f23ea4f76 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 88702025e56654ceb479d468ad0a565f23ea4f76: 317 of 317 plants selected, none judged (--list)
```

The full hosted Plants and changed-source mutation checks are pending on the reviewable draft. T005 remains
open until the exact candidate's hosted outcomes are recorded. The visual and axe integration inventories
are marked CI-only in the focused phase scope. Both remain in the required hosted Unit tests inventory.
