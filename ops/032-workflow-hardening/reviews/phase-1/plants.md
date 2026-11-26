# Plants of phase 1

- base: b8f06d5c652aae2c308d0a09f3e991e800138004
- selector: `pnpm run gate:plants -- --affected b8f06d5c652aae2c308d0a09f3e991e800138004 --list`
- selector exit: 0

The selector includes all 326 Plants because the operation changes shared gate source. The required Plants check will judge the full set on the hosted candidate.

```text
note: affected: every plant, by gates/bin/story-evidence.ts (shared gate source)
plants: affected since b8f06d5c652aae2c308d0a09f3e991e800138004: 326 of 326 plants selected, none judged (--list)
```
