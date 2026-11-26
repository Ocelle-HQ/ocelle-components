export const focusedStorybookTests = "storybook/test/unit/";

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

/** A focused file must have the same single declared owner in the normal and default mutation configurations. */
export function hasUniqueHostRoute(
  test: string,
  project: string,
  normalProjects: readonly string[],
  mutationProjects: readonly string[],
): boolean {
  if (!test.startsWith(focusedStorybookTests) || normalProjects.length !== 1 || mutationProjects.length !== 1) {
    return false;
  }
  // Vitest qualifies browser project names with the configured instance, e.g. storybook-browser (chromium).
  return mutationProjects.some((owner) => owner === normalProjects[0]
    && (owner === project || (owner.startsWith(`${project} (`) && owner.endsWith(")"))));
}
