// Plant for the content-security check: the externaliser names the tags it moves.
export const moved: readonly string[] = ["<script>", "<style>", `<p style="color: red">`];

export function isInline(tag: string): boolean {
  return tag === "<script>" || tag === "<style>";
}
