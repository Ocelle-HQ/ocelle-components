// The entry of the plant bundle for the fixture pages (specs/010-feedback-forms contracts/testing.md § Plants;
// analysis U9; T016): global-setup.ts bundles it with Lit into `<dir>/plants/ocelle-plants.js`, which serve.ts serves
// and only the plant rows' pages load. It defines each notice plant of test/fixtures/notice-plants.ts under its tag,
// and `ocelle-notice` itself (the import of src/ocelle-notice.ts), so a page that loads only this bundle has both.
import { define } from "../../src/define.ts";
import { noticePlants } from "../fixtures/notice-plants.ts";

for (const [tag, plant] of Object.entries(noticePlants)) define(tag, plant);
