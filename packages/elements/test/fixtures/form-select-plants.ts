// The select's planted defects (specs/010-feedback-forms contracts/testing.md § Plants and § Plants, Seams; research.md
// R-07, R-09; data-model.md § Plant seams; analysis G11, U7; T052). Each plant is a class derived from
// `ocelle-form-select`'s with one rule changed, overriding one protected member of `OcelleFormSelect` or of its base
// class (src/form-control.ts): the option observer's setup, the indicator's static styles, the validity step. Test
// fixtures only, shipped in no package. test/plants.test.ts defines each under its tag in process. The protected names
// below are the seams src/ocelle-form-select.ts declares in green; the tests run untyped (the typecheck gate runs at the
// phase's end), so the plants load against the scaffold too. This module imports only `OcelleFormSelect` and `define`
// (and Lit's `css` for the styles plant).
import { css } from "lit";
import { define } from "../../src/define.ts";
import { OcelleFormSelect } from "../../src/ocelle-form-select.ts";

/** Option mirroring: the option observer misses `characterData`, so an option's edited text is not mirrored. */
class MissesCharacterData extends OcelleFormSelect {
  protected override optionObservation(): MutationObserverInit {
    return { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "label", "selected", "disabled"] };
  }
}

/** Indicator: the indicator takes pointer events, so a click on it does not reach the native select. */
class IndicatorTakesPointer extends OcelleFormSelect {
  static override styles = [
    OcelleFormSelect.styles,
    css`
      svg {
        pointer-events: auto;
      }
    `,
  ];
}

/** Validity: `setValidity({})` always, so the host is always valid. */
class AlwaysValid extends OcelleFormSelect {
  protected override syncValidity(): void {
    this.internals.setValidity({});
  }
}

/** Each plant by its tag. */
export const formSelectPlants: Readonly<Record<string, CustomElementConstructor>> = {
  "ocelle-plant-select-misses-character-data": MissesCharacterData,
  "ocelle-plant-select-indicator-pointer": IndicatorTakesPointer,
  "ocelle-plant-select-always-valid": AlwaysValid,
};

/** Defines each plant under its tag. */
export function defineFormSelectPlants(): void {
  for (const [tag, plant] of Object.entries(formSelectPlants)) define(tag, plant);
}
