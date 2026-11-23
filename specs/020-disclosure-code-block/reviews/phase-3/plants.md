# Plants of phase 3

- base: e39524c54f643a19315489db7c19f9773e1bf5a9
- command: pnpm run gate:plants -- --affected e39524c54f643a19315489db7c19f9773e1bf5a9
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected e39524c54f643a19315489db7c19f9773e1bf5a9
plants: affected since e39524c54f643a19315489db7c19f9773e1bf5a9: no plant selected, 0 of 317 plants judged; not the Plants check
```

No plant selected: this phase's changes (the README and records under `specs/`) map to none. CI's Plants check judges every plant.
