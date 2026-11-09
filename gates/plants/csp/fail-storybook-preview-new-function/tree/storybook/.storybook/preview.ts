// Plant for the content-security check: the preview configuration builds code from a string.
import type { Preview } from "@storybook/html-vite";

const theme = new Function("return 'light'") as () => string;

const preview: Preview = { initialGlobals: { theme: theme() } };

export default preview;
