# Research

## Reuse the icon registry

**Decision.** Extend the typed registry in `packages/elements/src/icons.ts` with five exact names and use `icon-svg.ts` for rendering.

**Rationale.** The 13-name registry currently covers navigation arrows and generic actions. None of the five requested meanings is present. The shared renderer supplies currentColor and the 24-unit drawing conventions. The tests have independent drawing, mirror and stroke expectations in `packages/elements/test/{icons-expected.ts,scenarios/icon-set.ts}`.

**Alternatives.** Per-control SVGs would duplicate the shared catalog and could drift in dimensions, accessibility and colour.

## Make initials a button presentation

**Decision.** Add an optional string on `ocelle-button` for a named standalone native button without slotted visible content. Paint its circular plate as a decorative SVG and position escaped HTML text over it.

**Rationale.** `packages/elements/src/ocelle-button.ts` already owns the native button, moved ARIA attributes, name resolution, focus and activation. A circular inner drawing can use the established avatar and semantic accent tokens without changing control radius or focus. The default 44 px target fits the 52 px rail after its two 4 px paddings. The compact icon link size is 40 px and is a different comparison. A full-size flush chrome button is the rail geometry control.

**Alternatives.** A child in the existing icon slot is pinned to the icon-size token by `icon-slot.ts`. A separate control would duplicate semantics and event integration. A CSS pill radius would misuse a state-only token. An account menu is a host integration on the separately tracked popover interface.

## Check real interaction and actual scaling

**Decision.** Use the existing Chromium scenarios and built strict-CSP wrappers. Inspect exact accessibility names, real keyboard events, target/rail geometry, appearance and visible focus. Measure both narrow viewport and enlarged text at their actual rendered values.

**Rationale.** `test/scenarios/button.ts` already exercises 44 px icon-only targets, accessibility names, forced colours and host activation. `test/scenarios/personal-rail.ts` proves narrow layout, divider geometry and focus. `test/scenarios/copy-field.ts` demonstrates 200% root font-size scaling at an independently configured viewport. These precedents preserve the current runner and pinned browser evidence.

**Alternatives.** A static screenshot alone cannot distinguish missing controls, vacuous keyboard tests or duplicate announcements.
