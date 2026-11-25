# Issue #11 (read 2026-11-25 through the GitHub tools; created 2026-11-02, updated 2026-11-02, no comments)

**Title:** Release v1.0.0 to public npm and make the repository public
**Parent:** #1

The first release is **v1.0.0**: `@ocelle/tokens`, `@ocelle/styles` and `@ocelle/elements` on the public npm registry, and the repository flips from `internal` to public on the same day (#2).

- [ ] npm org `ocelle` claimed; a publish token for CI stored as a repository secret (never committed).
- [ ] Release workflow on tag: build, run every check (including the `sk-` prefix and no-monospace checks), publish to npm with provenance.
- [ ] Changelog per package; semver from 1.0.0.
- [ ] From a clean machine with no `~/.npmrc` token, `pnpm add @ocelle/elements` works.
- [ ] Before the flip: `SECURITY.md` and the private reporting channel exist (#4), the history contains no secrets, and `THIRD_PARTY_NOTICES` lists the font licence.
- [ ] Repository visibility changed to public.
- [ ] **GitHub private vulnerability reporting switched on** right after the flip (it is documented for public repositories), and `SECURITY.md`'s "until public, contact the maintainers" line removed (spec 001, FR-032).

Blocked by: #4 and every element issue (#7, #8, #9, #12, #13, #14, #15, #16, #17). v1.0.0 ships only when every row of the gap table in #1 is met.
