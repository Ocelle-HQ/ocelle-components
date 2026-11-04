// The Storybook UI theme (FR-023, US1 scenario 13; contracts/gates.md § Monospace in Storybook). Scaffold: the theme
// is exported with empty font values and not yet passed to the manager.
import { create } from "storybook/theming";

export const theme = create({ base: "light", fontBase: "", fontCode: "" });
