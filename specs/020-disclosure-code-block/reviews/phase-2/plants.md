# Plants of phase 2

- base: cca63571794b57f2e4f1443e6d65c29d0d098d18
- command: pnpm run gate:plants -- --affected cca63571794b57f2e4f1443e6d65c29d0d098d18
- exit: 143 (stopped by the implementer after five minutes, 221 plant times printed, by the operator's CI-first
  decision of 2026-11-20 (`reviews/operator-ci-first.md`): the selection is the full set, a multi-hour local run;
  CI's Plants check judges every plant)
- selection (`pnpm run gate:plants -- --affected cca63571794b57f2e4f1443e6d65c29d0d098d18 --list`):
  `note: affected: every plant, by packages/elements/package.json (not mapped)` and `plants: affected since
  cca63571794b57f2e4f1443e6d65c29d0d098d18: 317 of 317 plants selected, none judged (--list)`, as in phase 1
  (research.md § Repository-wide notes).

```text
```

No finding line was printed before the stop (every line above is a `note:`); the gate's verdict on these plants is
CI's.

## Element plants (tasks.md T033; contracts/checks.md § Plants)

Each code-block plant run once on 2026-11-21 against the green source: `src/ocelle-code-block.ts` edited as named, the
guarding bodies run in process (`packages/elements/test/code-block.test.ts`, `-t <guard>`), then the file restored
and the restore checked byte for byte. Scratch runner in the session scratchpad; no plant is committed.

| Plant | Guard run | Result |
|---|---|---|
| `.code` `font-family` removed | US2-1 | bites: fails |
| `pre-wrap` replaced by `pre` in wrap mode | US2-3 | bites: fails |
| `max-inline-size` removed | US2-2 | bites: fails |
| digest gap removed | US2-9 | bites: fails |
| transparent border removed | US2-17 | bites: fails |
| `white-space: nowrap` removed from the groups | US2-12 base64url body | bites: fails |
| gap moved back to `margin-inline-start` on the unit after each `wbr` | US2-12 base64url body (line-start assertion) | bites: fails |
| `.code { min-block-size: 1lh }` removed | US2-19 | bites: fails |
| `.code { direction: ltr }` removed | US2-8 visual order | bites: fails |
| `direction: ltr` moved from `.code` to `.block` | US2-8 line starts (at rest) | bites: fails |
| the element's `rtl` opening `scrollTo` removed | US2-8 line starts | bites: the at-rest and text-change bodies fail; the `ltr` control passes, as it must |
| `.block:focus-visible` ring removed | FR-025 bodies | bites: the two focus-on-switch bodies fail; the switch-both-ways body, which reads no ring, passes |

The first run of the last plant used the pattern `FR-025.*focus`, which selected no test (44 skipped); it was run
again with `FR-025`, recorded above.
