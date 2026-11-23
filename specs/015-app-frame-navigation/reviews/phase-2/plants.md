# Plants of phase 2

- base: 024919efb21756f8cbb413878302154c00914fea
- selection command: pnpm run gate:plants -- --affected 024919efb21756f8cbb413878302154c00914fea --list
- hosted command: pnpm run gate:plants -- --verdict storybook/.visual/plant-shards
- exit: 0 (hosted aggregate)

The local selection reports `note: affected: every plant, by packages/elements/package.json (not mapped)`. The hosted aggregate checked every plant using 77 shard reports at commit `5e8f5b1`, covering the full affected selection. The earlier local affected run could not execute its visual cases with the configured container engines.

[Successful hosted Plants job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44937526430/job/136951933672)
