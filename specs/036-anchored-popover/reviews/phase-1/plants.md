# Plants of Phase 1

- base: 58a38e180433d2b1eb748ac321e1234acd761c4b
- selector: `node gates/bin/plants.ts --affected 58a38e180433d2b1eb748ac321e1234acd761c4b --list`
- selector exit: 0

The selector included all 326 Plants because `packages/elements/package.json` does not have an affected-case mapping. The exact-head [scope control](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46047111974/job/140669004952) confirmed this selection. The [required CI aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46039694975/job/140654532562) passed with all 326 Plants as expected on the same tree (`ce2c696922ac3b2dc759f890bc1712d541a40d75`). The hosted aggregate supplies the actual verdict for the affected set.

The [manifest preflight](manifest-preflight.md) judged all eight affected manifest overlays as expected, including seven exact seeded findings and the reordered pass. The intentional parser-error fixture has the phase-base blob.
