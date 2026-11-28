# Phase 2 Unicode whitespace correction

| Finding | Resolution | Red evidence | Implementation |
| --- | --- | --- | --- |
| JavaScript trim removed U+FEFF and retained U+0085. | Fixed. The button accepts a complete non-whitespace run surrounded by Unicode `White_Space`, then applies the control and grapheme checks to that run. | `d93001b5bdd5e70dc87b939c55c75ecfcf9c4dea` recorded four assertion failures across both source Chromium and the built strict-CSP fixture. Each input replaced an already-visible W. Leading and trailing NEXT LINE must reveal A, while a leading or trailing zero-width no-break space cluster must restore ordinary presentation and retain the action name. | `packages/elements/src/ocelle-button.ts`, with the input rules in the package README and executable cases in both button harnesses. |

The match consumes both ends in one pass and uses a positive-length capture for the initials. A global replacement is unnecessary. Removing either anchor allows the existing internally separated `A B` rejection case to match partially. Padded decomposed text, multiple surrounding whitespace characters, and embedded or standalone controls remain covered.
