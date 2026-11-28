# Plants of phase 1

- base: e340eefa9128bc1e5ede06cc06fb46a252d7a702
- command: pnpm run gate:plants -- --affected e340eefa9128bc1e5ede06cc06fb46a252d7a702 --list
- exit: 0

The exit code is for the affected selector, invoked through the gate entry point shown below.

```text
$ node gates/bin/plants.ts -- --affected e340eefa9128bc1e5ede06cc06fb46a252d7a702 --list
note: affected: every plant, by stryker.elements.config.json (not mapped)
plants: affected since e340eefa9128bc1e5ede06cc06fb46a252d7a702: 326 of 326 plants selected, none judged (--list)
```

The local pull of the pinned Docker image failed with `ENOSPC`. Local evidence covers selection. The required hosted
check judged all 326 Plants successfully on head `77cb025da872be76e49190b51a9ed24a9e61be1b`, base
`b655b83b1d17694039f7b5c968e483384145a90a` and tested merge `bd09017155b06f3cdac3d4166ae71877f69c051d`.
This was run `45834538582`, attempt `1`. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582/job/139971400646)
