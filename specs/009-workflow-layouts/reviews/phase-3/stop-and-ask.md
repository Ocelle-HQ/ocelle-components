# Phase 3 stop-and-ask: plant B13 does not bite (T044)

tasks.md lists "a plant that does not bite" as a stop-and-ask point, and its guard rules say that a plant that does not
make its guard fail stops the phase. The phase stopped here: T044 stays open.

## Where the phase stands

- The red commit (`ecaf46f`) is recorded by `red.sh 3 phase` (tests only, red, exit 1). The green commit (`2b4bca9`)
  implements T038 to T043. In process and on the strict-CSP fixture, every board and lane scenario passes (20 board and
  8 lane bodies in process, the same 28 on the fixture).
- Sixteen of the seventeen pairing plants of T032 were run once and bite (`plants.md`: B1 to B12, B14 to B17). B17 is
  the guard the phase 2 review's R1-03 asked for: the overflow-region module's `slotchange` listener is not equivalent
  for the board.
- **B13** (no fade clearance: the module neither scrolls a focused card nor suppresses a fade) does **not** bite. US2-15
  in Frame N passes with it, 20 of 20 board bodies.

## Why B13 does not bite

US2-15's Frame N body focuses, by Tab and by Shift+Tab, the four cards US2-15 names for the ring at the board's edges:
the first card of the first lane, the first and last card of the middle lane, and the last card of the last lane. In
Frame N (636 px, a 222 px scroll range, lanes at 5 + 172 i px of the content) each of them is either at an end of the
scroll range when it takes focus, where that side does not fade, or already inside the box more than a fade's depth
from the fading side (the middle lane spans 349 to 509 px of a box that fades from 604 px). Chromium's own focus
scrolling therefore leaves each one clear without the module's clearance. The body does not reach the other clause of
US2-15 for Frame N: "a card in a lane partly off-screen is scrolled into view with its ring box clear of the fades".

## The fix, ready to apply

In `packages/elements/test/scenarios/board.ts`, `cardRings`, add two cards in lanes partly off-screen when they take
focus, with the same per-step check (`cardStep`: the ring box inside the box, clear of each fading edge, and the fades
on exactly the off-screen sides):

- `l3c0` by Tab, after `l2c2`: lane 3 spans 521 to 681 px of the content and the box shows 0 to 636 px, so the browser
  alone scrolls it to 45 px and leaves its ring box (to 686 px) under the end fade, and 5 px of its ring cut;
- `l1c2` by Shift+Tab, after `l2c0` from the end of the walk: lane 1 spans 177 to 337 px while the box is scrolled to
  the end (222 px), so the browser alone scrolls it to 177 px and leaves its ring box (from 172 px) under the start
  fade, and 5 px of its ring cut.

The expected steps are written by hand as for the other cards (`{ active, inside: true, clear: true, fades: true }`),
and the walk lists in `cardRingsExpected` grow by these two. This makes the test stricter; it changes no assertion that
was red. Then run B13 once more (as recorded in `plants.md`), and, if it bites, record it, tick T044 and run the rest of
T044's gates.

## Question for the operator

May the implementer strengthen US2-15's Frame N body with the two cards in lanes partly off-screen (`l3c0` by Tab,
`l1c2` by Shift+Tab), as written above, run plant B13 once more and, if it bites, record it in `plants.md`, tick T044
and send phase 3 to review? If it still does not bite, the phase stops again with that result.
