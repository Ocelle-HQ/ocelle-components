# Plants of phase 2

- base: 7b16ae326e11aa837b4d0f8540881e69c8d622c3
- selector: `pnpm run gate:plants -- --affected 7b16ae326e11aa837b4d0f8540881e69c8d622c3 --list`
- selector exit: 0

The Vitest project addition selects the entire Plant registry. The required hosted Plants check judges all 326 cases, including the pinned Visual and empty-index Plants.

```text
note: affected: every plant, by vitest.config.ts (not mapped)
plants: affected since 7b16ae326e11aa837b4d0f8540881e69c8d622c3: 326 of 326 plants selected, none judged (--list)
```
