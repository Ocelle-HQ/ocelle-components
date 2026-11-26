export function focusedStorybookTests(): string {
  return "storybook/test/unit/";
}

function withoutMatches(from: readonly string[], take: readonly string[]): string[] {
  const remaining = [...take];
  return from.filter((finding) => {
    const match = remaining.indexOf(finding);
    if (match === -1) return true;
    remaining.splice(match, 1);
    return false;
  });
}

/** Compare each raw message and its multiplicity. The usual Plants verdict can compare a message substring. */
export function compareOverlayFindings(expected: readonly string[], findings: readonly string[]) {
  return {
    unexpectedFindings: withoutMatches(findings, expected),
    missingFindings: withoutMatches(expected, findings),
  };
}

function onlyProject(projects: readonly string[]): string | undefined {
  return projects.length === 1 ? projects[0] : undefined;
}

/** A focused file must have the same single declared owner in the normal and default mutation configurations. */
export function hasUniqueHostRoute(
  test: string,
  project: string,
  normalProjects: readonly string[],
  mutationProjects: readonly string[],
): boolean {
  const owner = onlyProject(mutationProjects);
  // Vitest qualifies browser project names with the configured instance, e.g. storybook-browser (chromium).
  return test.startsWith(focusedStorybookTests()) && owner !== undefined && owner === onlyProject(normalProjects)
    && (owner === project || (owner.startsWith(`${project} (`) && owner.endsWith(")")));
}
