// The input's planted defects (specs/010-feedback-forms contracts/testing.md § Plants and § Plants, Seams; research.md
// R-09; data-model.md § Plant seams; analysis G11, U7; T034). Each plant is a class derived from `ocelle-form-input`'s
// with one rule changed: an element class overriding one protected method of `OcelleFormInput` or of its base class
// (src/form-control.ts), or an element whose protected `createAnnouncer()` returns a class derived from phase 2's
// `Announcer` with one protected step overridden. Test fixtures only, shipped in no package. test/plants.test.ts
// defines each under its tag in process. The protected names below are the seams src/form-control.ts and
// src/ocelle-form-input.ts declare in green; the tests run untyped (the typecheck gate runs at the phase's end), so the
// plants load against the scaffold too. This module imports only `OcelleFormInput`, `Announcer` and `define`.
import { html } from "lit";
import { define } from "../../src/define.ts";
import { Announcer } from "../../src/live.ts";
import { OcelleFormInput } from "../../src/ocelle-form-input.ts";

type Read = () => { readonly text: string; readonly politeness: "polite" | "assertive" };

/** An input whose announcer is `kind`. */
function withAnnouncer(kind: new (read: Read) => Announcer): typeof OcelleFormInput {
  return class extends OcelleFormInput {
    protected override createAnnouncer(read: Read): Announcer {
      return new kind(read);
    }
  };
}

// The announcer plants.

/** Insertion announcement: no empty wait, so the region is created already holding the error. */
class NoWait extends Announcer {
  protected override wait(): void {
    this.end();
  }
}

/** Reveal baseline: an insertion or a reveal does not set the baseline to none, so the re-check applies to it. */
class KeepsBaseline extends Announcer {
  protected override forget(): void {
    // the baseline is kept
  }
}

/** Error baseline: no whitespace normalisation; the error is compared and written as the host wrote it. */
class RawError extends Announcer {
  protected override normalise(text: string): string {
    return text;
  }
}

// The element plants.

/** Error baseline: clearing the error does not reset the baseline, so the same error set again is not announced. */
class ClearKeepsBaseline extends OcelleFormInput {
  protected override clearError(): void {
    this.announcer.cancel();
  }
}

/** First load: the first draft's rule, first load when the constructor finds the element connected. */
class ConstructedConnected extends OcelleFormInput {
  readonly constructedConnected = this.isConnected;

  protected override isFirstLoad(): boolean {
    return this.constructedConnected;
  }
}

/** First load: announces on first load. */
class NeverFirstLoad extends OcelleFormInput {
  protected override isFirstLoad(): boolean {
    return false;
  }
}

/** Move: the move flag never set. */
class NoMove extends OcelleFormInput {
  protected override startMove(): void {
    // no move flag
  }
}

/** Hidden: the host's `hidden` attribute is ignored, so hiding cancels nothing and a reveal announces nothing. */
class IgnoresHidden extends OcelleFormInput {
  protected override onHidden(): void {
    // hiding and revealing change nothing
  }
}

/** Host ARIA: a host `aria-invalid="true"` ignored, the field invalid only for the element's own error. */
class IgnoresHostInvalid extends OcelleFormInput {
  protected override invalidForAT(): boolean {
    return this.error.trim() !== "";
  }
}

/** Host ARIA: a host `aria-invalid="false"` clears the element's own invalid state. */
class HostFalseClears extends OcelleFormInput {
  protected override invalidForAT(): boolean {
    return this.getAttribute("aria-invalid") !== "false" && super.invalidForAT();
  }
}

/** Naming: the name span not hidden, so its text is in the tree a second time. */
class VisibleName extends OcelleFormInput {
  protected override nameHolder(name: string): unknown {
    return html`<span id="name">${name}</span>`;
  }
}

/** Naming: the external labels not observed, so a changed label text does not rename the field until a focus. */
class UnobservedLabels extends OcelleFormInput {
  protected override observeLabels(): void {
    // the labels' text changes are not observed
  }
}

/** Change event: no last-committed guard, so Enter then leaving the field dispatches twice. */
class NoCommitGuard extends OcelleFormInput {
  protected override uncommitted(): boolean {
    return true;
  }
}

/** Implicit submission: Enter never submits. */
class NeverSubmits extends OcelleFormInput {
  protected override implicitSubmit(): void {
    // Enter submits nothing
  }
}

/** Implicit submission: the one-field rule ignored, every form without a default button submits. */
class IgnoresOneField extends OcelleFormInput {
  protected override blockingFields(): number {
    return 1;
  }
}

/** Form value: `setFormValue` forgotten, so the form data never holds the value. */
class ForgetsFormValue extends OcelleFormInput {
  protected override syncFormValue(): void {
    // no setFormValue
  }
}

/** Form value: a reset keeps the typed value. */
class ResetKeeps extends OcelleFormInput {
  protected override resetValue(): void {
    // the typed value stays
  }
}

/** Form value: a history restore ignored. */
class RestoreIgnored extends OcelleFormInput {
  protected override restoreValue(): void {
    // the restored state is dropped
  }
}

/** Validity: `setValidity({})` always, so the host is always valid. */
class AlwaysValid extends OcelleFormInput {
  protected override syncValidity(): void {
    this.internals.setValidity({});
  }
}

/** Each plant by its tag. */
export const formInputPlants: Readonly<Record<string, CustomElementConstructor>> = {
  "ocelle-plant-input-no-wait": withAnnouncer(NoWait),
  "ocelle-plant-input-keeps-baseline": withAnnouncer(KeepsBaseline),
  "ocelle-plant-input-raw-error": withAnnouncer(RawError),
  "ocelle-plant-input-clear-keeps-baseline": ClearKeepsBaseline,
  "ocelle-plant-input-constructed-connected": ConstructedConnected,
  "ocelle-plant-input-never-first-load": NeverFirstLoad,
  "ocelle-plant-input-no-move": NoMove,
  "ocelle-plant-input-ignores-hidden": IgnoresHidden,
  "ocelle-plant-input-ignores-host-invalid": IgnoresHostInvalid,
  "ocelle-plant-input-host-false-clears": HostFalseClears,
  "ocelle-plant-input-visible-name": VisibleName,
  "ocelle-plant-input-unobserved-labels": UnobservedLabels,
  "ocelle-plant-input-no-commit-guard": NoCommitGuard,
  "ocelle-plant-input-never-submits": NeverSubmits,
  "ocelle-plant-input-ignores-one-field": IgnoresOneField,
  "ocelle-plant-input-forgets-form-value": ForgetsFormValue,
  "ocelle-plant-input-reset-keeps": ResetKeeps,
  "ocelle-plant-input-restore-ignored": RestoreIgnored,
  "ocelle-plant-input-always-valid": AlwaysValid,
};

/** Defines each plant under its tag. */
export function defineFormInputPlants(): void {
  for (const [tag, plant] of Object.entries(formInputPlants)) define(tag, plant);
}
