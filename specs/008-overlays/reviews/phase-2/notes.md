# Phase 2 notes: User Story 1, a modal dialog

## Measurements (T013, T014) and operator decisions

`measure.md` holds T013 (manifest inheritance), T014 (the opaque-content and positive-`tabindex` lists) and the
repeated-Escape investigation. Operator decisions taken during the phase (fixes-4 to fixes-6): the sentinel wrap;
manifest "analyse, then drop it"; Tab inside a nested native modal is the platform's (measured lists); the long-body
story's scroll-edge block; the repeated-Escape row's warm-up.

## Scaffold and red (T020)

- Scaffold `6711652` (`scaffold.sha`): `src/focusable.ts`, `src/overlay.ts`, `src/ocelle-dialog.ts` with their
  signatures and no behaviour, not defined and not exported from the root.
- Red commit `cdc4698` (amended once before green; `red-commits`), test files only; `red.sh 2 phase`: `tests_only`
  true, `red` true. Log: `red-phase.log`, 548 of 3688 tests failed:
  - every row of the shared dialog bodies, in process (234) and on the fixture (235), by assertion or by a bounded
    poll that names the missing event ("2 events not recorded within 1 000 ms"), or the missing close control
    ("no [part="close-button"] in #dlg"): `ocelle-dialog` is not defined;
  - the before-definition case (no definition after the bounded wait), the entry test, the export keys;
  - the manifest tests (no dialog entry, the generator not reading `src/overlay.ts`), the README and CHANGELOG
    fragments (45), the dist and pack lists (3 + 1);
  - the 16 dialog story tests and the gate story counts (`storybook-build` 29 stories, `axe` and `visual` 58
    story-themes, the 58 baseline files);
  - the manifest gate's repository runs (`gates/test/manifest.test.ts` × 2, `gates/test/integration/manifest.test.ts`),
    which were then red because the scaffold's module was not in the committed manifest; their count of checked
    elements is updated to 3 in commit `3c3d275`.
- The first red run (before the amend) showed TypeErrors in ten style rows (an absent part read as `undefined`), a
  15 s hang of the before-definition test (an unbounded `whenDefined`) and two nested-modal rows that passed (they
  asserted only the platform's lists); the amend made the stand-in's `inspect` return empty attributes and styles for an
  absent part, bounded the wait to 1 000 ms, and added the top-layer order to the nested-modal rows.

## Green (T021 to T025)

- `vitest run` of `elements`, `elements-touch`, `elements-node`, `elements-browser`, `elements-build`: 891 passed at
  green; after T025's rows 1125 passed (`c8ad511`): the shared dialog bodies are 350 rows, in process and on the
  strict-CSP fixture.
- `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest` (3 elements), `gate:csp`,
  `gate:prefix`, `gate:config-copies`: no finding; the first seven again at `c8ad511`, one at a time, no finding.
- One red test moved, assertions unchanged (green commit body): the repeated-Escape case runs on a page of its own in
  each harness, since after the other rows of the in-process page the platform's second `cancel` stayed cancelable
  despite the warm-up.
- The empty-heading note of axe on the host-`aria-label` story (minor) made the axe gate test's note count 12; the
  heading is now `hidden` while `label` is empty, and the close control keeps its place (`margin-inline-start: auto`)
  (fix commit after green).
- Two count tests R-16 decision D did not list, updated by hand (count only): the manifest gate's repository runs
  (3 elements) and the axe gate's unlabelled-button plant run (60 story-themes, the repository's 58 and the plant's 2).

## Mutation (T025)

### The first run and why most of its Timeouts were not the mutants'

`gate:mutation -- --base cc18f84` on `47c1118` (both configurations; line numbers below are that commit's): 139
findings in the element source, 1232 mutants on changed lines, 225 timeouts, 438 compile errors.

| File | Survived | NoCoverage | Timeout (report lines) |
|---|---|---|---|
| `src/overlay.ts` | 61 | 24 | 158 |
| `src/focusable.ts` | 35 | 18 | 67 |
| `scripts/manifest.ts` | 1 | 0 | 0 |

Cause of the Timeouts, read from the run's JSON report (`coveredBy`, the tests' ids): `test/dialog.test.ts` named its
tests `it.each(dialogScenarios)("$name")`, and Vitest shortens a `$name` interpolation to 40 characters (39 and `…`).
The 233 rows had 95 distinct test names; every row of a shared prefix (62 rows `Slotted non-modal dialogs (US1-16,
R-02…`, 20 `Slotted non-modal dialogs: opened after…`, 12 `Tab cycle with opaque content (US1-14, …`, …) was one test
id to Stryker. Its per-test coverage and its test filter (a regular expression of the names) then ran all the rows of
each covering name for a mutant, while the time budget of the mutant was that of the covering ids, one row each: under
the 8 concurrent browser runs of `stryker.elements.config.json` on this machine's 4 cores, any mutant covered by a
shared prefix of more than a few rows ran out of time whether its rows failed or passed. Mutants on lines every row
reaches (the walk, `render()`, `updated()`, `#show()`) ran all 233 rows on the budget of 95, and the mutants there
that stop the open, the Tab handling or the close of every row also made each row run into its bounded waits (the 1
000 ms `events` poll, the 350 ms `after` pause) before it failed. `test/dialog.test.ts` now names each test by its
row's full name (commit `f0cce54`), so coverage, filter and budget agree; the assertions are unchanged.

### How each finding of the first run was resolved

Each finding is killed by a row of the shared bodies (both harnesses) that checks what the spec or the matrix states
where the rule decides (test commits `b30e65a`, `d9c121b`, `f0cce54`, `5c4bf91`, `956a183`, `2807789`, `743f421`,
`6ceaf53`, `99383d8`), or removed with the code that decided nothing (`827ae7b`, `d604c02`, `475e880`, `e89883c`,
`04d1934`, `4cc19fd`, `3e5542f`, `c00a83e`), or, where the code is the design's and the mutant is equivalent, carries
a reasoned record (list below). Every row added passes on the source it was written against, except the two red rows
below.

| First run (`47c1118` lines) | Code | Resolution |
|---|---|---|
| `manifest.ts:121` ArrayDeclaration | `existsSync(dir) ? readdirSync(dir) : []` | Equivalent, recorded (below). |
| `focusable.ts:48` "" (NoCoverage) | `hasAttribute("controls")` of `isMedia` | Initial focus: a media element with controls. |
| `focusable.ts:58` (NoCoverage) | `:disabled` is no stop | Initial focus past a disabled button; Tab cycle: a disabled button last. |
| `focusable.ts:60` × 9 (NoCoverage) | `<a>` / `<area>` without `href` | Initial focus past an `<a>` without href; an `<a>` with `tabindex=0` is a stop; Tab cycle: an `<a>` without href last, one with `tabindex=-1` last. The `<area>` test removed: an `<area>` has no layout box, so it is never a rendered stop. |
| `focusable.ts:61` × 2 | `<input type="hidden">` | Removed: a hidden input has no layout box even with author `display` (measured, Chromium 153), so `rendered()` already excludes it. |
| `focusable.ts:70` × 5 | the scroller's overflow per axis | Tab cycle: a vertical scroller last; a non-overflowing `overflow: auto` block last is no stop. |
| `focusable.ts:77` (NoCoverage) | a slot's fallback content | Initial focus and Tab cycle: a slot's fallback button in a slotted open shadow root. |
| `focusable.ts:85` × 7 | radio group: name, form, tree | Tab cycle: two groups of different names; one name in two forms; one name with the second radio in a slotted open shadow root. |
| `focusable.ts:97` (NoCoverage) | SVG elements are walked | Initial focus: a button in an SVG `foreignObject`. The later `return false` for an element neither HTML nor SVG: a scroller holding prose and MathML. |
| `focusable.ts:105` "" | an opaque host's `tabindex` | Removed: a host without `tabindex` reads -1, which orders as 0 (`tabIndex <= 0`, the rest in tree order). |
| `focusable.ts:107` × 3 | radio, named | Tab cycle: same-name checkboxes (each a stop); unnamed radios (each a stop). |
| `focusable.ts:110`, `:116` | `chosen` | Removed: a group has one checked radio at most, so `chosen` was always undefined when the radio was checked. |
| `focusable.ts:118`, `:120` | the replaced radio's index guard | Removed: the group's first is always in the list. |
| `focusable.ts:121`, `:161`–`:164` × 9 | `replace()` of the scope entry | Tab cycle: a radio group last with its checked radio second; a group alone (its first at index 0 of its scope); initial focus: the checked radio of a group of three. |
| `focusable.ts:123` | the group holds a stop | Tab cycle: a scroller holding a radio is no stop. |
| `focusable.ts:143` | the scroller in the flat list | Tab cycle: a vertical scroller last (the ends). |
| `focusable.ts:145`, `:147` × 4 | the scroller before its nested scope | Removed: replaced by the position taken before the subtree, as in the flat list. |
| `focusable.ts:149` | a scroller holds a stop | Tab cycle: nested scrollers, only the inner one a stop. |
| `focusable.ts:155` (NoCoverage) | `walk()` of a shadow root | Removed: `walk()` is called with an element only. |
| `focusable.ts:170` | ascending positive `tabindex` | Tab cycle: `tabindex` 3 then 1, the body's only stops. |
| `overlay.ts:36` | `within()` | Focus return (d): A's opener removed, B opened in the same task, focus moved within B during A's exit: it stays (FR-009). |
| `overlay.ts:64` (NoCoverage) | no `closedBy` (WebKit 17) | Removed: `closedBy` is read through the property (the computed state, lower case), undefined in an engine without it, as R-02 has it ("read only where the engine has the `closedBy` property"). |
| `overlay.ts:74` × 3 (NoCoverage) | a duration in seconds | Motion: `--ocelle-motion-base: 0.3s` runs 300 ms; the later `endsWith("s")` → `""`: a token without a unit gives no motion. |
| `overlay.ts:322` | the panel's `aria-label` | Equivalent, recorded: R-08 sets it only with a host `aria-label` ("instead"); one given as well is outranked by `aria-labelledby`. (`d604c02` had set it always; `04d1934` restored R-08's form.) |
| `overlay.ts:343` | the heading text without label | Accessibility tree without label or host `aria-label`: no name, no heading. |
| `overlay.ts:359` | the reopen during closing | Rapid toggle during the entry: the entry animation runs on, no event. |
| `overlay.ts:387`–`:389` (NoCoverage) | the inner dialog open at show | Platform open: the inner dialog shown through the shadow root, then `open`: shown modally. The own-close count of R-03 and R-05a (removed in `827ae7b`, restored in `e89883c` as the design's) is `#closeOwn()`; the synthetic close row and the reopen-then-platform-close row kill what is not equivalent, records for the rest. |
| `overlay.ts:417` "" | autofocus in a slotted shadow root | Initial focus: an autofocus button in a slotted element's open shadow root. |
| `overlay.ts:426` × 2 | the overlay beneath's rendered target | Nested: a hidden autofocus button first in the outer's body. |
| `overlay.ts:441`–`:450` × 7 (NoCoverage) | `#tryFocus`'s result, `#landed`'s opaque walk | Removed: no caller read the result, and the deep active element already stops at opaque content. |
| `overlay.ts:498`, `:500` × 3 | keeping focus another overlay took | The block: focus return (d). The refocus of `before` removed: the inner `close()` moves focus only from inside the dialog. |
| `overlay.ts:535` "" (NoCoverage) | the easing fallback | Motion: `--ocelle-easing-standard: initial` gives a linear entry. |
| `overlay.ts:548` | the close control while shown | The close control after the entry ended (the existing rows click during the entry). |
| `overlay.ts:573` × 3 | Escape in a search field | A text field with a value and an empty search field request, with no cancel event (the platform's own cancel gave the same request). |
| `overlay.ts:598` × 3 | the popover close watchers | A shown `popover="manual"` is no close watcher: request, no cancel event. The attribute reads replaced by the `popover` property. |
| `overlay.ts:609` | a cancel that is not the panel's | A bubbling cancel from a slotted button: not prevented, no request. |
| `overlay.ts:613` | a cancel during the exit | A cancelable cancel during the exit: no second request. |
| `overlay.ts:629`, `:630`, `:637`, `:638`, `:641` | platform close during the exit | A platform `close()` during the exit (one close, reason escape), and during a 1 000 ms exit (the close at once). The flag of `#finish` removed. |
| `overlay.ts:701` | the non-stop move's rest | Rewritten as the later and earlier candidates (both directions checked by the non-stop rows). |
| `overlay.ts:710`, `:711` × 11 | the repair's guards | A closed shadow root before an iframe: focus stays in the frame. The stack, closed and closing checks and the related-target check removed (the close control of an overlay beneath is inert, a closed one is not rendered, during the exit the end of the close returns focus anyway, and a related target has focus); the first stop is the close control. |
| `overlay.ts:723`–`:727` × 7 | the footer slot | Footer filled and emptied after open. The unchanged-flag return removed. |
| `overlay.ts:758`–`:782` × 25 | `before()`, `flatKids()` | Rewritten on `flatChildren()` and the children after `a`'s branch; the non-stop rows from a slotted open shadow root. |

### Findings the full test names unmasked

With every test named in full (`f0cce54`), the run of `overlay.ts` lines 446–758 and the run of `focusable.ts` with
`overlay.ts` lines 1–445 (`475e880`) gave 6 and 14 Timeouts where the same ranges had given 79 and 144 (76 and 68) with
the shortened names, and 32 and 76 survivors and no-coverage mutants that those Timeouts had hidden. Resolved the same
way:

| Code (`475e880` lines) | Resolution |
|---|---|
| `#request` closes only while open or shown (`:450`) | Removed in the close-request listener: no close event (FR-022). |
| the end of the exit checks the state (`:461`), the current animation (`:528`) | Removed: every change of state during the exit cancels its animation, and a cancelled animation does not finish. |
| `#leave` (`:482`–`:484`) | The index guard removed (only an overlay on the stack leaves it); `#listen(false)`: after the close, Escape and Tab from the body dispatch nothing; `#syncTop()`: nested, the outer handles Tab from the body after the inner closed. |
| `duration <= 0` (`:520`) | A negative duration row (no motion, no console message); `still()` with a record for the 0 ms boundary. |
| the trims of computed custom properties (`:524`, `:70`) | Removed: Chromium serialises them without surrounding white space. |
| `fromBody` (`:545`), the stack check of `#key` (`:549`) | Removed: the active element is null then; a key reaches an overlay beneath only through the top one, which prevented it or is `:modal` above. Two dialogs, B over A: Tab from the body in B gives B's first stop. |
| `#nonModal` (`:574`), the null check of `#onClose` (`:609`) | Removed: a modal dialog in the below record is a close watcher above first; a `close` event's target is a dialog. |
| `#onToggle` (`:630`, `:632`) | Kept (R-02); equivalent, recorded: the close event of the same close leaves the record, and the cancel fallback puts back a dialog its opening toggle took out (the same-task row shows the outcome). |
| the sentinel filter (`:643`), `stops` (`:649`), the end check (`:664`) | Removed: the sentinel's `tabindex` is -1; the ends are the first and last candidates in navigation order. |
| `isOpaqueContent(active)` (`:661`) | An audio element with controls last: its two controls are reached in both directions. |
| `#onFocusout`'s related target (`:697`) | Removed: a related target has focus, so the deep active element is not null. |
| `#onBodySlot`, `#observeContent` (`:705`–`:719`) | Short viewport: content given the default slot after open makes the body a stop; shortening it, or the one overflowing paragraph, ends it. |
| `#measure`'s unchanged return (`:727`) | Removed (an update with the same value). |
| `before()`'s `<=` (`:759`) | Rewritten: `b` after `a` when its branch is among the children after `a`'s. |
| `isMedia` (`focusable.ts:48`) | An `HTMLMediaElement` with controls; a button with an attribute named controls is an ordinary stop; the audio row. |
| `rendered()` (`focusable.ts:53`) | A `display: none` and a `visibility: hidden` button last. |
| `sequential()`'s iframe case (`:63`), `href` (`:64`) | The iframe case removed (it reads `tabIndex` 0); an `<a>` with href last. |
| `scroller()` (`:70`, `:72`) | A scroller with `tabindex=-1`, one with `overflow-y: scroll`, an overflowing `overflow: hidden` block, last. |
| `visit()`'s early returns (`:100`, `:101`, `:134`) | Removed for non-HTML elements, `hidden` and iframe or media children (walked to no candidate); `inert`: an inert block last, a scroller holding only an inert button. |
| the radio replacement (`:123`) | Initial focus: a button before a group whose second radio is checked. |
| `holds` and `inside` (`:126`, `:131`, `:143`, `:147`, `:149`, `:151`) | Initial focus: a scroller first; one holding a button in a block; one holding a radio; nested scrollers. |
| `!holds` (`:144`) | Equivalent, recorded: a stop that also scrolls without a `tabindex` (a textarea) would be listed twice, side by side. |
| navigation scopes (`:136`), positive ranks (`:169`) | Positive `tabindex` inside a plain block (no scope) and in a slotted open shadow root (its own scope); `ordered()` ranks in one stable sort. |
| `deepActive()`'s root element (`:178`) | Removed: the root element never has focus here. |
| `descendants()` (`overlay.ts:52`) | A popover menu inside a slotted block is a close watcher. |
| the observed `aria-label` (`:90`, `:295`) | A host `aria-label` set while open names the dialog. |
| `eventPrefix` (`:257`) | Declared in the base, set by each subclass. |
| the footer flag (`:267`, `:300`) | `connectedCallback` removed: the footer slot's `slotchange` fires on the first assignment. |
| the overflow flag (`:266`) | Equivalent, recorded: measured by the body's resize observer before any key reaches the panel. |
| `super.disconnectedCallback()` (`:304`) | Equivalent, recorded: no reactive controller or async directive. |
| the closed check of `disconnectedCallback` (`:306`) | A closed dialog removed while another is open: the open one still handles Tab from the body. |
| the close listener's capture (`:331`), the focusout capture (`:343`) | The first recorded (toggles cover the slotted closes); the second removed (focusout bubbles). |
| `firstUpdated`'s observer (`:348`–`:355`) | The body becomes a stop when the viewport shrinks; the short-viewport rows. |
| `updated()`'s `changed.has` (`:359`), the host close while shown (`:362`) | Removed: any other combination does nothing; a host close after the entry ended. |
| `#syncTop` and `#listen` (`:368`–`:375`) | Two dialogs, B over A (only the top listens); `#listen` idempotent; after the close no listener. |
| the queued measure at show (`:396`) | Removed: the resize observer fires when the body gets its box. |
| opening to shown (`:399`, `:400`) | Equivalent, recorded: opening and shown are handled alike everywhere (each check names both); the state is the data model's. |
| the close control as the last initial target (`:432`) | A footer autofocus button and nothing focusable in the body: the close control (the platform would focus the footer button). |

The next runs (`04d1934`: `focusable.ts` and the gate files 4 findings, `overlay.ts` 1–445 4 findings, 446–784 6
findings) were resolved the same way:

| Code (`04d1934` and `4cc19fd` lines) | Resolution |
|---|---|
| the opaque candidate in the flat list (`focusable.ts:111`) | Initial focus: a closed shadow root with `delegatesFocus` first gives its first inner button. |
| the top scope among the scopes (`focusable.ts:156`) | Removed: the top scope of the panel's and the body's walks holds no radio button. |
| `replace()`'s index guard (`focusable.ts:165`) | Equivalent, recorded. |
| `deepActive()`'s null test (`focusable.ts:182`) | Removed: a null active element is returned as null without it. |
| the closed check of `disconnectedCallback` (`overlay.ts:307`) | A closed dialog removed and re-inserted while another is open, then opened over it: Tab from the body in it gives its first stop. |
| the toggle listener's call (`:341`), the close event's record removal (`:623`), `#onToggle`'s body (`:652`) | Equivalent, recorded (the close event and the toggle of one close each leave the below record). |
| `firstUpdated`'s observers (`:356`, `:357`) | The body observer: the viewport shrinks to 1280 × 256 and the body becomes a stop; the content observer removed (the first `slotchange` observes the content). |
| the exit branch of `#onClose` (`:641`) | A close event dispatched on the inner dialog after the close changes nothing. |
| the back wrap's opaque test (`:691`) | Equivalent, recorded: the native backward move from the end sentinel reaches the last candidate as well; R-04 keeps the explicit move. |
| `#onBodySlot`'s measure (`:732`) | Removed: the resize observer reports each newly observed element at once. |
| `#onFooterSlot`'s update (`:737`) | Footer content given from no slot after open, and taken away again. |

**Red rows, and the fixes they led to**: "Tab cycle: what is a stop, at the cycle's ends: a video without controls last,
not a stop" (Tab) failed on the committed source (`b1 body dlg[button] b1`): a `<video>` without `controls` reads
`tabIndex` 0 yet is no sequential stop, and the walk took it as the last stop, so Tab from b1 left the cycle. Fixed in
`827ae7b` (a media element without controls is a stop only with a `tabindex`, as an `<a>` without `href`). "Tab cycle
with opaque content at the end: a closed shadow root before a tabindex=1 button" (Tab) failed on `475e880`
(`b1 dlg[button] b1 …`): the button is the last stop in navigation order but not in the tree, and the wrap from it
skipped the closed root after it in navigation order, against FR-008. Fixed in `e89883c` (the ends from the navigation
order alone).

### Equivalent-mutant records

Each is a reasoned next-line record above the line (the gate lists them as `record` lines); the mutants named there
are equivalent, or the only ones of their kind on the line that are not are killed elsewhere as stated.

| Mutated line | Mutators | Why no test can tell |
|---|---|---|
| `scripts/manifest.ts:122` `existsSync(dir) ? readdirSync(dir) : []` | ArrayDeclaration | A missing directory then lists one name, `Stryker was here`, neither an `ocelle-*.ts` module nor `overlay.ts`: nothing is read and the generator rejects with the same message. |
| `focusable.ts:146` the scroller test | ConditionalExpression | `!holds` → true lists a stop that also scrolls without a `tabindex` (a textarea) twice, side by side: neither end nor any explicit move changes. (`false` of the whole test, which the scroller rows kill, shares the mutator.) |
| `focusable.ts:168` `replace()`'s `index >= 0` | ConditionalExpression | The scopes without the radio give -1, and an assignment at -1 adds a property, no entry, which no array method reads. |
| `overlay.ts:77` `still()` | EqualityOperator | `>=` differs at exactly 0 ms: no animation, or one that ends at the next frame, before any observation. (`<=`, which the motion rows would kill, shares the mutator.) |
| `overlay.ts:271` `#overflowing = false` | BooleanLiteral | The body's resize observer measures it when the body gets its box at `showModal()`, before any key reaches the panel. |
| `overlay.ts:305` `super.disconnectedCallback()` | CallExpression | Lit's own disconnection serves reactive controllers and async directives; the overlays use neither. |
| `overlay.ts:324` the panel's `aria-label` | ConditionalExpression, LogicalOperator | An `aria-label` given as well while the heading labels the panel (`aria-labelledby` wins), or an empty one where the host's is blank, gives the same name. (`false` of the whole condition, which the host `aria-label` rows would kill, shares the mutator.) |
| `overlay.ts:336` the close listener's `capture` | BooleanLiteral | Without capture the slotted dialogs' close events are not seen; their toggles leave the below record. |
| `overlay.ts:340`, `:342`, `:345` the toggle listener | BlockStatement, CallExpression, BooleanLiteral | Every close of a slotted dialog also fires its close event, which leaves the record. |
| `overlay.ts:399`, `:401` opening to shown | BlockStatement; ConditionalExpression, EqualityOperator | Every check of the state names opening and shown together; the two states are the data model's. |
| `overlay.ts:487` `#ownCloses += 1` | AssignmentOperator | A count that goes down lets the queued event through to the `dialog.open` check, which ignores it as well (the dialog is open again), or to the state (closed). |
| `overlay.ts:625` the close event's `#below.delete` | CallExpression | The toggle with `oldState` `open` of the same close leaves the record as well. |
| `overlay.ts:629` `if (this.#ownCloses > 0) {` | ConditionalExpression, BlockStatement | An own event let through is ignored by the `dialog.open` check or the state, as the count would. (`true`, which the platform close rows would kill, shares the mutator; `>=` and `-=` → `+=` are killed by the platform close and the reopen-then-platform-close rows.) |
| `overlay.ts:655`, `:658`, `:660` `#onToggle` | BlockStatement; ConditionalExpression, LogicalOperator, EqualityOperator; ConditionalExpression, EqualityOperator, StringLiteral | The close event of the same close leaves the record; the panel is never in it and deleting any other target changes nothing; a dialog its opening toggle wrongly takes out is put back by the cancel fallback on the next Escape, with the same request (the same-task row). |
| `overlay.ts:695` the back wrap's `isOpaqueContent(last.element)` | ConditionalExpression | The native backward move from the end sentinel also reaches the last candidate in navigation order, as every Shift+Tab wrap row measures; R-04 keeps the explicit move where the last candidate is a stop. |
| `overlay.ts:771` `before()`'s `if (a === b) return false` | ConditionalExpression, BooleanLiteral | Every call compares the active element, which is no candidate there, with a candidate: `false` and `return true` differ only for one element against itself, which only a mutant of the walk or of the stop test brings about. (`true`, which the non-stop rows would kill, shares the mutator.) The test turned those mutants from hangs (Timeouts) into assertion failures (`c8ad511`). |

### The first run's Timeout report lines, line by line

All 225 share the cause stated above: a row name shortened to 40 characters made Stryker run every row of that name
on the time budget of one. The table lists every report line of the first run (`47c1118` lines, the count of report
lines on each in brackets), what the mutants there stop, and what became of them once the rows had full names.

| Report lines | Code | What the mutants stop, and their fate |
|---|---|---|
| `focusable.ts:39` (1), `:48` (8), `:53` (5) | `isOpaque`, `isMedia`, `rendered` | Which elements are stops, so the Tab rows' ends and the initial focus rows: killed by assertion by the stop rows (`b30e65a`, `2807789`), `isMedia` rewritten. |
| `focusable.ts:58` (1), `:59` (4), `:60` (5), `:61` (4) | `sequential` | The same: killed by the disabled, `<a>`, media rows; the iframe, `<area>` and hidden-input tests removed. |
| `focusable.ts:67` (3), `:69` (4), `:70` (3) | `scroller` | Scrollers as stops: killed by the scroller rows (`tabindex=-1`, `scroll`, `hidden`, the axes). |
| `focusable.ts:77` (2), `:79` (1) | `flatChildren` | The walk into slots and shadow roots, so every row's focus lists: killed by assertion. |
| `focusable.ts:97` (2), `:98` (5) | `visit`'s early returns | The SVG return removed; the `inert` return killed by the inert rows, the `hidden` test removed. |
| `focusable.ts:128` (1), `:131` (4), `:133` (3), `:136` (1), `:140` (1), `:141` (1), `:151` (2), `:154` (1) | `visit`'s holds, the iframe return, nested scopes, the scroller test, the scopes list | Every row's focus lists: killed by assertion (the navigation-scope ones through `before()`'s own test since `c8ad511`), or removed (`:131`, the iframe and media return; `:154`, the top scope among the scopes). |
| `focusable.ts:170` (3) | `ordered` | The navigation order: killed by the positive `tabindex` rows; rewritten as one stable sort. |
| `focusable.ts:179` (2) | `deepActive` | The body path and focus return: killed by assertion; the root-element and null tests removed. |
| `overlay.ts:35` (1), `:41` (1), `:52` (1) | `within`, `inert`, `descendants` loops | `each !== ancestor` and the removed recursion made those loops run to the document or miss content: killed by assertion (the focus return and close watcher rows). |
| `overlay.ts:64` (3), `:65` (3), `:66` (7) | `closesOnRequest` | Every slotted non-modal dialog row (62 rows under one shortened name): killed by assertion; the attribute read replaced by `closedBy`. |
| `overlay.ts:71` (1), `:73` (2), `:74` (1) | `milliseconds` | Every row's motion: killed by assertion (the motion rows), the trim and NaN test removed. |
| `overlay.ts:91` (1), `:291` (1) | the observed `aria-label` | Killed by the host `aria-label` set while open. |
| `overlay.ts:252` (1), `:262` (1), `:263` (1), `:269` (1) | the event prefix, the overflow and footer flags, the default close label | Every row's events or rendering: the prefix declared in the base, the overflow flag recorded, the footer flag's initial value killed by the empty-footer row, the close label by the tree rows. |
| `overlay.ts:296` (4), `:299`–`:313` (9) | `connectedCallback`, `disconnectedCallback` | The footer at mount and the silent close on removal: the first removed (`slotchange`), the second killed by the removal and move rows, with records for Lit's call and the own-close count. |
| `overlay.ts:317`–`:343` (15) | `render()` | The panel's name, listeners and parts in every row: killed, records for the `aria-label` and the capture options (see the list). |
| `overlay.ts:346`–`:353` (5) | `firstUpdated` | The body's observer: killed by the viewport rows; the content observation moved to the first `slotchange`. |
| `overlay.ts:357`–`:360` (7) | `updated` | Every open and close: killed; the `changed.has` test removed. |
| `overlay.ts:366`, `:371`, `:373` (3) | `#syncTop`, `#listen` | The body path: killed by the two-dialog and after-close rows. |
| `overlay.ts:387`, `:396`–`:400` (7) | `#show` | Every open: killed, the queued measure removed, the opening step recorded. |
| `overlay.ts:432` (1), `:439` (2) | the initial targets | Initial focus in every row: killed. |
| `overlay.ts:457`–`:505` (17) | `#request`, `#begin`, `#finish`, `#leave`, `#returnFocus` | Every close: killed by the close rows; the stale-state checks removed, the own-close count recorded. |
| `overlay.ts:522` (6), `:529`–`:539` (10) | the keyframes, `#animate` | Every row's motion: killed by the motion rows; the current-animation test removed, `still()` recorded at 0 ms. |
| `overlay.ts:556` (1), `:560` (1), `:567` (1), `:574` (1) | the input handlers | Every Escape and Tab row: killed; the `fromBody` flag and the stack test removed. |
| `overlay.ts:585` (1), `:596`–`:602` (9) | `#dialogs`, `#watcherAbove` | The close watcher rows: killed; the popover test reads the property. |
| `overlay.ts:621` (1), `:625` (2), `:626` (1) | `#onClose` | The platform close and stale close rows: killed; the null test removed, records for the own-close count. |
| `overlay.ts:645` (1), `:647` (5) | `#onToggle` | The slotted non-modal rows: equivalent, recorded (the close event of the same close). |
| `overlay.ts:658` (2), `:662` (1), `:664` (2), `:675` (1), `:677` (1), `:680` (1) | `#candidates`, `#tab` | Every Tab row: killed; the sentinel filter, the stop list and the flat-tree end check removed (the last fixed a skipped stop, `e89883c`); the stop test now ends in assertions through `before()`'s own test (`c8ad511`). |
| `overlay.ts:708` (1) | the repair | Killed by the opaque rows; the guards reduced to the deep active element. |
| `overlay.ts:718`–`:720` (3), `:730` (1), `:734` (1), `:742` (1) | the body slot, `#observeContent`, `#measure` | Killed by the short-viewport rows; the slot's measure and the unchanged return removed. |
| `overlay.ts:758` (2) | `before()`'s loop | Rewritten; its mutants of the loop that never ends are the final runs' two Timeouts below. |

### The final runs

`gate:mutation -- --base cc18f84`, the whole diff in three `--files` runs (one run of the whole diff takes longer
here than the one hour a command may run; CI shards it anyway), each exit 0, output in `mutation.log`:

| Run | Commit | Entries | Mutants on changed lines | Survived, NoCoverage | Timeouts | Compile errors | Records |
|---|---|---|---|---|---|---|---|
| 1 | `c8ad511` | the six gate files (no mutant on their changed lines), `scripts/manifest.ts`, `src/focusable.ts`, `src/index.ts` (no mutant), `src/ocelle-dialog.ts` | 290 | 0 | 0 | 90 | 280 (the gate files' process-boundary records included) |
| 2 | `c00a83e` | `src/overlay.ts:1-446` | 249 | 0 | 0 | 93 | 11 |
| 3 | `c8ad511` | `src/overlay.ts:447-790` | 394 | 0 | 2 | 157 | 8 |

Run 2's lines are the same in `c8ad511`; the only later change, `before()`'s own test, alters a mutant's outcome only
where it reached `before()` with one element twice, which hangs (a Timeout), and run 2 had none.

### The final runs' Timeout report lines, line by line

| Report line | Cause |
|---|---|
| `packages/elements/src/overlay.ts:774: mutation: timeout: CallExpression: replaced by ;` | `path.unshift(each)` removed leaves both flat-tree paths of `before()` empty, so `pa[index] === pb[index]` compares undefined with undefined at every index and the loop never ends; the page hangs at the first explicit move from a non-stop. No assertion can kill it: the row never returns. Stryker's time limit is the kill. |
| `packages/elements/src/overlay.ts:780: mutation: timeout: AssignmentOperator: replaced by index -= 1` | The index runs below 0, where both paths read undefined, so the same loop never ends: the same hang, the same kill. |

The twelve Timeouts the `focusable.ts` run of `c00a83e` still had (the radio replacement in `replace()`, the
navigation scopes and `scopes.push`) were the same loop reached with one element twice: with a mutant there the
focused checked radio is no candidate of the navigation order, and the explicit move from it compared it with itself.
`before()`'s own test (`c8ad511`) ends that walk, and the rows' assertions kill those mutants (run 1: 0 Timeouts).

## Stories and baselines (T028, T029)

- `storybook/stories/dialog.stories.ts`: eight stories; the long-body story's `dialog-scroll-edge` block, sized by
  `storybook/.storybook/stories-layout.css`. Footer actions are slotted buttons.
- Baselines produced in the pinned container with `pnpm run visual:update` (docker): 16 files added, none changed or
  removed; a second run wrote 0 files. No cross-engine (podman) comparison was possible in this container: only docker
  is available (`gate:visual` reports "docker only: no cross-engine comparison"). CI's captures win over these.
- `gate:visual`: 58 captures match. `gate:axe`: 58 story-theme runs, 0 serious or critical, 10 notes (the excepted
  prose-document ones). `gate:storybook-build`: built 29 stories.
- `fail-token-changed` (`gates/plants/visual/fail-token-changed/plant.json`): measured in the pinned container by
  `gate:plants -- --shard 16` before the lines were added (8 unexpected `differs`, every dialog story in light), then
  the eight lines added; shard 16 then judged every plant as expected. Shards 19 (`visual/pass-repository`) and 27
  (`axe/pass-repository`) also judged every plant as expected. The full `gate:plants` was not run (longer than the
  session limit), so the other shards, among them the manifest plants of the changed generator, are left to CI.
- `storybook` and `storybook-integration` projects: 148 passed. `gates-integration` story-count, axe, visual and
  manifest tests and the `gates`, `tokens`, `styles` unit projects: passed.
