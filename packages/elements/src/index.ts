// The package root (005 FR-002, research.md R-02; specs/010-feedback-forms research.md R-11): importing it defines
// every element of the package, `ocelle-icon`, `ocelle-brand-mark` and `ocelle-notice`, and exports their classes, in
// code-point order of name.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export type { IconName } from "./ocelle-icon.ts";
export { OcelleNotice } from "./ocelle-notice.ts";
export type { NoticeSize, NoticeTone } from "./ocelle-notice.ts";
