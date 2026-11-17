# Contract: story configuration (FR-006, FR-007)

Both copies, `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml`,
byte-identical. Phase 1 (bootstrap) sets `test_command` and `setup_command`; phase 3 (US2) sets `mutation_command`.
The final values:

```yaml
test_command: "pnpm test"
setup_command: "pnpm run setup:offline"
test_pathspec: ":(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts"
mutation_command: "pnpm run gate:mutation"
knowledge_dir: "knowledge/speckit-flows"
```

(Comment lines stay as they are.) The mutation command takes its base as `-- --base <sha>`. Since story extension
1.2.2 the red/green check runs `setup_command` and `test_command` from the current configuration in every worktree
it checks out, so a phase base that predates the runner is still checked with these commands.

Story review command change (`speckit.story.review`, step 4): read the phase base from
`FEATURE_DIR/reviews/phase-<N>/base.sha` and run the mutation command as `<mutation_command> -- --base <sha>` (for
this repository `pnpm run gate:mutation -- --base <sha>`, covered by the `Bash(pnpm run:*)` allowlist entry in
unattended runs). The change is made in the source
`tooling/speckit/extensions/story/commands/speckit.story.review.md` and reinstalled with
`specify extension remove story && specify extension add --dev tooling/speckit/extensions/story`
(tooling/speckit/README.md), which updates every installed copy:

- `.specify/extensions/story/commands/speckit.story.review.md`
- `.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md`
- `.claude/skills/speckit-story-review/SKILL.md` (the copy the reviewer follows)

**Amendment (2026-11-15, op 016, `ops/016-plants-affected`).** The final values gain one key, with its comment line
after the `knowledge_dir` comment:

```yaml
plants_command: "pnpm run gate:plants"
```

A phase runs it as `<plants_command> -- --affected <phase base>` and keeps the output in
`FEATURE_DIR/reviews/phase-<N>/plants.md`; the reviewer re-runs it with `--list` and compares the selection. Empty:
the phase records no plant run. It is a local aid only: CI's required Plants check still judges every plant.
