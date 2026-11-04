// Plant for the content-security check: a Storybook build script runs a string as code.
const tags: readonly string[] = ["<script>", "<style>"];

export const count: unknown = eval(String(tags.length));
