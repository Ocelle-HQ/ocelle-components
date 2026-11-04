// The Storybook UI theme (FR-023, US1 scenario 13; contracts/gates.md § Monospace in Storybook): fontBase and
// fontCode are the family list of --ocelle-font-sans, so the manager shows no monospace. The theme is exported for
// its unit test and passed to the manager.
import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const fontSans = '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif';

export const theme = create({ base: "light", fontBase: fontSans, fontCode: fontSans });

addons.setConfig({ theme });
