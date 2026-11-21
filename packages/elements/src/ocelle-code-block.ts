// `ocelle-code-block` (020 spec US2, FR-020 to FR-035; research.md R-05 to R-07; data-model.md § `ocelle-code-block`):
// phase 2 scaffold, the module's signature with no behaviour (tasks.md T022).
import { LitElement, nothing } from "lit";
import { define } from "./define.ts";

/**
 * A preformatted block for code, commands, logs and digests, in the library's sans with tabular figures.
 *
 * @tagname ocelle-code-block
 */
export class OcelleCodeBlock extends LitElement {
  static override properties = {
    overflow: { type: String },
    label: { type: String },
    digest: { type: Boolean },
  };

  /**
   * The overflow policy.
   *
   * @default undefined
   */
  declare overflow: string | undefined;

  /**
   * The scroll box's name while it overflows.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * Whether the text is shown as a digest.
   *
   * @default undefined
   */
  declare digest: boolean | undefined;

  protected override render(): unknown {
    return nothing;
  }
}

define("ocelle-code-block", OcelleCodeBlock);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-code-block": OcelleCodeBlock;
  }
}
