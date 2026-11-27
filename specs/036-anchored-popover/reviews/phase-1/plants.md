# Plants of Phase 1

- base: 58a38e180433d2b1eb748ac321e1234acd761c4b
- selector: `node gates/bin/plants.ts --affected 58a38e180433d2b1eb748ac321e1234acd761c4b --list`
- selector exit: 0

The selector included all 326 Plants because `packages/elements/package.json` does not have an affected-case mapping. The full Plants verdict is pending.

The [manifest preflight](manifest-preflight.md) judged all eight affected manifest overlays as expected, including seven exact seeded findings and the reordered pass. The intentional parser-error fixture has the phase-base blob.
