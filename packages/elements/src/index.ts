// The package root (005 FR-002, research.md R-02; specs/010-feedback-forms research.md R-11; 013 contracts/elements.md
// § Modules and exports): importing it defines every element of the package, `ocelle-icon`, `ocelle-brand-mark`,
// `ocelle-notice`, `ocelle-form-input`, `ocelle-form-select`, `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state` and
// `ocelle-progress`, and exports their classes, in code-point order of name. The form controls' base class
// (src/form-control.ts) and the icon drawing (src/icon-svg.ts) are internal.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleEmptyState } from "./ocelle-empty-state.ts";
export { OcelleFact } from "./ocelle-fact.ts";
export { OcelleFacts } from "./ocelle-facts.ts";
export { OcelleFormInput } from "./ocelle-form-input.ts";
export type { FormInputType } from "./ocelle-form-input.ts";
export { OcelleFormSelect } from "./ocelle-form-select.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export type { IconName } from "./ocelle-icon.ts";
export { OcelleNotice } from "./ocelle-notice.ts";
export type { NoticeSize, NoticeTone } from "./ocelle-notice.ts";
export { OcelleProgress } from "./ocelle-progress.ts";
