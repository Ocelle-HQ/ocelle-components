# Container inspect fixtures (006 contracts/container.md § The pin check)

- `docker-containerd-inspect.json`, `docker-imagetools-manifest.json`, `docker-imagetools-tag-index.json`: recorded by
  the phase 1 spike (reviews/phase-1/spike.md § 6), docker 29.9.2 with the containerd image store, buildx v0.38.1.
- `docker-classic-inspect.json`: written from docker's documented `image inspect` format for the classic overlay2
  store (`Id` is the config digest there), not recorded: the sandbox runs the containerd store only.
- `podman-inspect.json`, `skopeo-inspect-raw-manifest.json`, `skopeo-inspect-raw-index.json`: recorded by phase 3's
  CI run 43211645709 (head `1b6ddd5`, the `pin-record` artifact of the "Visual regression" job, tasks.md T045 and
  T046f; plan decisions 22 and 27), on GitHub's ubuntu-24.04 runner with skopeo 1.13.3 (`skopeo version 1.13.3`):
  `podman image inspect <image>@<digest>` after the gate's podman pull (`Id` the config digest without `sha256:`,
  `Digest` the manifest digest), `skopeo inspect --raw docker://<image>@<digest>` (the pin's linux/amd64 manifest) and
  `skopeo inspect --raw docker://<image>:v1.64.1-noble` (the tag's index on 2026-11-12). No skopeo fixture is a copy
  any more. Skopeo's two outputs are byte for byte the spike's `docker-imagetools-manifest.json` and
  `docker-imagetools-tag-index.json`: a raw manifest is the registry's bytes, whichever tool fetches it, and the tag's
  index has not moved since the spike. The recorded podman output replaces the one written from podman's documented
  format; the tests' expected values stay written from the pin, and the mismatch cases change one field of it.
