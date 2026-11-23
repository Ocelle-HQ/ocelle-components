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

Security review, planning, selected and focused each have a light and dark baseline. All eight captures
matched byte for byte across two runs of the repository's capture library, using its pinned Docker image.

## Affected Plants

```text
$ pnpm run gate:plants -- --affected 88702025e56654ceb479d468ad0a565f23ea4f76 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 88702025e56654ceb479d468ad0a565f23ea4f76: 317 of 317 plants selected, none judged (--list)
```

The full hosted Plants and changed-source mutation checks are pending on the reviewable draft. T005 remains
open until the exact candidate's hosted outcomes are recorded. The visual and axe integration inventories
are marked CI-only in the focused phase scope. Both remain in the required hosted Unit tests inventory.
