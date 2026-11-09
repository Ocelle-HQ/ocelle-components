# spec-kitty-design issues cited by #6

Copied verbatim from the public repository spec-kitty/spec-kitty-design through the GitHub search API on 2026-11-09 (title, state and body of each issue). The `--sk-*` names are kitty-mission-ui roles, not names of this library.

## #535 No wrap policy for long machine identifiers (slugs, ids, paths) in rows, headers and fact values [open]
**Gap.** An unbroken identifier such as a mission slug widens its grid column or row, overflows at 200% zoom, or is cut by an ellipsis that hides the part the reader needs. The library has no utility, token or part to say "break anywhere in this text". The same need appears in action-row tags (#508), Facts values (#280) and code blocks (#520), each with its own local `overflow-wrap`.

**Ask.** A shared text-wrap utility (a class, attribute or part) for identifier text, with `overflow-wrap: anywhere` semantics, usable in `sk-action-row` text parts, `sk-page-header` subtitles and `sk-facts` values, so that the full id stays readable and copyable.

**Local stand-in until then (exception E-39).** The keyword `overflow-wrap: anywhere` on the slug in list rows, on the header and on the Facts `dd`, in three parts files. No length or colour is involved.

---

Source: the Drift screen in MOES-Media/kitty-mission-ui#10 uses a scoped local stand-in until this lands; its exception sunsets on this issue.


## #531 No compact screen type scale (14 px / 1.5 base) or mono value text style for dense operational screens [open]
**Gap.** Library text is 16 px with normal line height everywhere. A dense operational screen (slug, last scan time, explanation text, commands, table cells, fact values) is designed at 14 px with a 1.5 line height, and its identifiers and values are set in the mono face in a muted colour. Without a screen-level type scale, each part file repeats the size and line height, and the heights of titles, slugs and explanations drift from the prototype.

**Ask.** One of:
- a density or type-scale token set for a screen root (`--sk-text-sm` base size and a 1.5 line-height token), so children inherit it; and
- a "value" text style (mono face, small size, muted or body colour) available as a token set or part, for identifiers, timestamps, commands and fact values.

**Local stand-in until then (exception E-37, grants G-1 and G-2).** On the screen host: `font-size: var(--sk-text-sm)` and `line-height: 1.5` (the 1.5 is a pinned literal, no token exists). In the part files that draw identifiers and values: `font-family: var(--sk-font-mono)` and `color: var(--sk-fg-muted)`.

---

Source: the Drift screen in MOES-Media/kitty-mission-ui#10 uses a scoped local stand-in until this lands; its exception sunsets on this issue.


## #519 Prose family: prototype rhythm, a reading-measure token and element-selector tables with a scroll box [open]
**Gap.** `sk-prose` in `@spec-kitty/styles` 1.1.0-rc.10 is a styles-only sheet that does not match the approved Kitty Desktop prototype for rendered markdown documents:

- line height is 24 px, not 26.4 px (1.65);
- `h1` is 32 px and `h2` 24 px, not 30 px and 18 px;
- the table header is 14 px sans, not 12 px mono;
- there is no paragraph measure (the prototype holds running text to about 68ch);
- tables are styled only through `sk-data-table` classes, which a markdown renderer cannot emit.

So a consumer still styles headings, lists, quotes, code, rules and tables itself.

**Ask.** A `prose` family, or an updated `sk-prose`, that provides:

- the prototype's rhythm and heading scale;
- a reading-measure token for paragraphs and lists (for example `--sk-layout-reading-measure`);
- element-selector table styling that works on plain `table`/`th`/`td` markup;
- a table scroll box. A many-column table should scroll inside its own box rather than wrap every cell to its min-content width, and a readable cell floor helps with that.

Block content such as tables and code should be able to use the full width of its container while text keeps the measure.

**Local stand-in until then (exception E-23).** One stylesheet for the rendered document. Every value is a token except the pinned literals `max-width: 68ch` (the paragraph measure), `line-height: 1.65` and a `min-width: 12ch` cell floor. It is removed when the family ships.

---

Source: the Artifact Viewer screen in spec-kitty-mission-ui (mission-ui#7) uses a scoped local stand-in until this lands; its exception sunsets on this issue.


