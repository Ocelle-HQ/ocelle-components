# Contract: story configuration (FR-006, FR-007)

Both copies, `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml`,
byte-identical:

```yaml
test_command: "pnpm test"
setup_command: "pnpm run setup:offline"
test_pathspec: ":(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts"
mutation_command: "pnpm run gate:mutation"
knowledge_dir: "knowledge/speckit-flows"
```

(Comment lines stay as they are.) The mutation command reads its base from `OCELLE_MUTATION_BASE`.

Story review command change (`speckit.story.review`, step 4, in the source under `tooling/` and reinstalled): run the
mutation command as `OCELLE_MUTATION_BASE=$(cat FEATURE_DIR/reviews/phase-<N>/base.sha) <mutation_command>`.
