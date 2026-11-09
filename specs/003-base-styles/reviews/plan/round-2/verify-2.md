# Squad round 2: verify 2

I read the artifacts at `1aa34c2`. I measured the browser claim the fix depends on in Chromium 153.0.8010.12
(`/opt/pw-browsers/chromium-1243`) through the repository's Playwright 1.64.1. I used two methods. First, a script of my
own that copies the `values.test.ts` harness (a 1000px `position: relative` block, 16px, absolute probes, a 1280 x 800
viewport, the strict CSP). It loads `packages/tokens/dist/tokens.css` plus `--ocelle-measure-container: 100cqi` and
reads all 69 existing probes and the new one, with and without `container-type: inline-size`, in light and dark.
Second, the real `tokens-browser` suite run on a scratch copy of the repository, unchanged and with that one line added
to the probe block. The scripts and the copy are in the session scratchpad, not in the repository.

| ID | Status | Reason |
|----|--------|--------|
| PLAN-FRESH-2-001 | resolved | Still resolved, as in verify 1. fixes-2 changed only the wording that verify 1's note flagged. FR-017 and US3-3 now say a table that fits "does not overflow its box (its `clientWidth` equals its `scrollWidth`) and is not a tab stop". That replaces "as wide as its content" and matches what verify 1 measured in the definite-width dialog (1204/1204, not a tab stop). It contradicts nothing else in the artifacts. |
| PLAN-FRESH-2-002 | resolved | The caption mechanism is unchanged from verify 1 (measured there), and the token test is now right. Research R-08 drops the claim that an `expected.ts` probe can name a query container. It sets the entry to `{ property: "width", used: 1000 }` and names the harness change: the `values.test.ts` probe block gets `container-type: inline-size`, and its header comment names the query container. The plan source tree (both files), plan phase 4 (red against the unchanged harness), R-08's "Where a token is added" list and a new contracts/checks.md `tokens-browser` row all say the same. I measured it. With the harness as it is, `width: var(--ocelle-measure-container)` gives 1280px. With `container-type: inline-size` on the block it gives 1000px. So the 1000 entry is red before the change and green after it, and it would catch a fall back to the viewport. In light and dark, none of the other 69 probes changed value. The real suite passes 11/11 both unchanged and with the harness line added. This confirms R-08's and checks.md's "other probes unchanged". |
| PLAN-FRESH-2-003 | resolved | Still resolved, as in verify 1. fixes-2 changes nothing in R-09, US1-5, US1-10, SC-001 or the `page.html` and `media.svg` fixtures. |
| PLAN-FRESH-2-004 | resolved | Still resolved, as in verify 1. fixes-2 settles verify 1's note. Plan decision 3 and research R-03 now say "any rule of the host page's own stylesheets wins", and point out that a custom element's `:host` rules do not (decision 16, R-12). That agrees with the contract § Base layer and the spec Edge Cases. |
