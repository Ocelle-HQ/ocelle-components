// The package root (005 FR-002, research.md R-02; specs/010-feedback-forms research.md R-11): importing it defines
// every element of the package, `ocelle-icon`, `ocelle-brand-mark`, `ocelle-notice` and `ocelle-form-input`, and exports
// their classes, in code-point order of name. The form controls' base class (src/form-control.ts) is internal.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleFormInput } from "./ocelle-form-input.ts";
export type { FormInputType } from "./ocelle-form-input.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export type { IconName } from "./ocelle-icon.ts";
export { OcelleNotice } from "./ocelle-notice.ts";
export type { NoticeSize, NoticeTone } from "./ocelle-notice.ts";
