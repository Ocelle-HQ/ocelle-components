# Container inspect fixtures (006 contracts/container.md § The pin check)

- `docker-containerd-inspect.json`, `docker-imagetools-manifest.json`, `docker-imagetools-tag-index.json`: recorded by
  the phase 1 spike (reviews/phase-1/spike.md § 6), docker 29.9.2 with the containerd image store, buildx v0.38.1.
- `docker-classic-inspect.json`: written from docker's documented `image inspect` format for the classic overlay2
  store (`Id` is the config digest there), not recorded: the sandbox runs the containerd store only.
- `podman-inspect.json`: written from podman's documented `image inspect` format (`Id` the config digest without
  `sha256:`, `Digest` the manifest digest), not recorded: podman is not available here.
- `skopeo-inspect-raw-manifest.json`, `skopeo-inspect-raw-index.json`: the raw manifests the pin check reads under
  podman with `skopeo inspect --raw docker://<image>@<digest>` (operator decision 2026-11-11, plan decision 21). Until
  a CI run records skopeo's own output they are byte copies of `docker-imagetools-manifest.json` (the pin's linux/amd64
  manifest) and `docker-imagetools-tag-index.json` (the tag's index): a raw manifest is the registry's bytes, whichever
  tool fetches it.
- Phase 3's CI run (tasks.md T045) records podman's and skopeo's real outputs, which replace the written and copied
  fixtures (research.md R-02).
