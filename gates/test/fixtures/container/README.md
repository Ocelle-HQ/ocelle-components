# Container inspect fixtures (006 contracts/container.md § The pin check)

- `docker-containerd-inspect.json`, `docker-imagetools-manifest.json`, `docker-imagetools-tag-index.json`: recorded by
  the phase 1 spike (reviews/phase-1/spike.md § 6), docker 29.9.2 with the containerd image store, buildx v0.38.1.
- `docker-classic-inspect.json`: written from docker's documented `image inspect` format for the classic overlay2
  store (`Id` is the config digest there), not recorded: the sandbox runs the containerd store only.
- `podman-inspect.json`, `podman-manifest-inspect.json`: written from podman's documented `image inspect` and
  `manifest inspect` formats (`Id` the config digest without `sha256:`, `Digest` the manifest digest), not recorded:
  podman is not available here. Phase 3's CI run records podman's real outputs (research.md R-02, tasks.md T045).
