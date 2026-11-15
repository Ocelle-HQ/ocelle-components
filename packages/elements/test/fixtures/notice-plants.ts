// The notice's planted defects (specs/010-feedback-forms contracts/testing.md § Plants and § Plants, Seams; research.md
// R-09; data-model.md § Plant seams; T016). Each plant is a class derived from the real one with one rule changed: an
// element class overriding one protected method of `OcelleNotice`, or an element whose protected `createAnnouncer()`
// returns a class derived from `Announcer` with one protected step overridden. Test fixtures only, shipped in no
// package. test/plants.test.ts defines each under its tag in process; test/browser/plants-entry.ts defines them for the
// fixture pages. The protected names below are the seams src/live.ts and src/ocelle-notice.ts declare in green; the
// tests run untyped (the typecheck gate runs at the phase's end), so the plants load against the scaffold too.
import type { PropertyValues } from "lit";
import { Announcer } from "../../src/live.ts";
import { OcelleNotice } from "../../src/ocelle-notice.ts";

type Read = () => { readonly text: string; readonly politeness: "polite" | "assertive" };

/** A notice whose announcer is `kind`. */
function withAnnouncer(kind: new (read: Read) => Announcer): typeof OcelleNotice {
  return class extends OcelleNotice {
    protected override createAnnouncer(read: Read): Announcer {
      return new kind(read);
    }
  };
}

// The announcer plants (family: what each must turn red is in test/plants.test.ts).

/** Insertion announcement: no empty wait, so the region is created already holding the text. */
class NoWait extends Announcer {
  protected override wait(): void {
    this.end();
  }
}

/** Merge window: no restart; each trigger writes the text it saw after its own wait. */
class NoRestart extends Announcer {
  protected override wait(): void {
    const { text, politeness } = this.read();
    setTimeout(() => {
      this.write(this.normalise(text), politeness);
    }, this.waitTime());
  }
}

/** Minimum hold: a trigger during the hold empties the copy at once. */
class NoMinimumHold extends Announcer {
  protected override minimumHold(): number {
    return 0;
  }
}

/** Baseline re-check: writes at the end of the wait without comparing with the baseline. */
class NoRecheck extends Announcer {
  protected override recheck(text: string): boolean {
    return text !== "";
  }
}

/** Reveal baseline: an insertion or a reveal does not set the baseline to none, so the re-check applies to it. */
class KeepsBaseline extends Announcer {
  protected override forget(): void {
    // the baseline is kept
  }
}

/** Hold: empties the copy after W instead of H. */
class ShortHold extends Announcer {
  protected override hold(): void {
    this.timer = setTimeout(() => {
      this.release();
    }, this.waitTime());
  }
}

/** First load, late write: writes exactly the pre-load W after the baseline is taken at first load. */
class LateWrite extends Announcer {
  protected override setBaseline(reading: ReturnType<Read>): void {
    super.setBaseline(reading);
    setTimeout(() => {
      this.write(this.normalise(reading.text), reading.politeness);
    }, 2 * this.delay("loading"));
  }
}

/** Short-lived empty state: the text written in a microtask after the trigger. */
class MicrotaskWrite extends Announcer {
  protected override wait(): void {
    queueMicrotask(() => {
      this.end();
    });
  }
}

/** Short-lived empty state: the text written in the first animation frame after the trigger. */
class FrameWrite extends Announcer {
  protected override wait(): void {
    requestAnimationFrame(() => {
      this.end();
    });
  }
}

/** Text baseline: compares with the last written copy before normalising. */
class RawBaseline extends Announcer {
  protected override normalise(text: string): string {
    return text;
  }
}

// The element plants.

/** Alert path: writes the copy for a `role="alert"` host on insertion, reveal and a change to `alert`. */
class AlertCopies extends OcelleNotice {
  protected override alertPath(trigger: "insertion" | "role"): void {
    this.announcer.trigger(trigger === "insertion");
  }
}

/** Alert baseline: the alert path takes the baseline synchronously, at the DOM operation. */
class AlertBaselineNow extends OcelleNotice {
  protected override postAlertStep(): void {
    this.alertStep();
  }
}

/** Alert pending role: a change from `alert` to `status` while the alert baseline is pending leaves the marker set. */
class AlertPendingRole extends OcelleNotice {
  protected override leaveAlert(): void {
    // the marker stays set
  }
}

/** Alert step after reset: the end-of-task step sets the baseline even when the marker has already been reset. */
class AlertStepAfterReset extends OcelleNotice {
  protected override alertStep(): void {
    this.pending = "none";
    this.announcer.takeBaseline();
  }
}

/** Politeness: always polite. */
class AlwaysPolite extends OcelleNotice {
  protected override politeness(): "polite" | "assertive" {
    return "polite";
  }
}

/** Politeness baseline: announces on any tone change. */
class AnyTone extends OcelleNotice {
  protected override onTone(): void {
    if (this.isLive() && !this.hidden) this.announcer.trigger(true);
  }
}

/** Hidden: the host's `hidden` attribute is ignored, so the notice goes on announcing while hidden and has no reveal. */
class IgnoresHidden extends OcelleNotice {
  protected override onHidden(): void {
    // hiding and revealing change nothing
  }
}

/** Nested region: the content wrapper also carries `aria-live`. */
class NestedRegion extends OcelleNotice {
  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.shadowRoot?.querySelector(".box")?.setAttribute("aria-live", "polite");
  }
}

/** Host-role region: `internals.ariaLive` left unset, so a host `role="status"` makes the host's node a live region. */
class HostRegion extends OcelleNotice {
  protected override setupInternals(): void {
    // ariaLive left unset
  }
}

/** Heading gap: the heading part not hidden when the heading is absent. */
class HeadingAlways extends OcelleNotice {
  protected override headingPresent(): boolean {
    return true;
  }
}

/** First load: the first draft's rule, first load when the constructor finds the element connected. */
class ConstructedConnected extends OcelleNotice {
  readonly constructedConnected = this.isConnected;

  protected override isFirstLoad(): boolean {
    return this.constructedConnected;
  }
}

/** First load: announces on first load. */
class NeverFirstLoad extends OcelleNotice {
  protected override isFirstLoad(): boolean {
    return false;
  }
}

/** Move: the move flag never set. */
class NoMove extends OcelleNotice {
  protected override startMove(): void {
    // no move flag
  }
}

/** Later task: the move flag never cleared. */
class MoveForever extends OcelleNotice {
  protected override endMove(): void {
    // the flag stays set
  }
}

/**
 * First load, deaf window: light-DOM changes are ignored for 100 ms after a first load, so a change in the first task
 * after the load is not announced (phase 2 review round 1, R1-01).
 */
class DeafAfterFirstLoad extends OcelleNotice {
  #firstLoadAt = Number.NEGATIVE_INFINITY;

  protected override isFirstLoad(): boolean {
    const first = super.isFirstLoad();
    if (first) this.#firstLoadAt = performance.now();
    return first;
  }

  protected override onContent(): void {
    if (performance.now() - this.#firstLoadAt < 100) return;
    super.onContent();
  }
}

/** Each plant by its tag. */
export const noticePlants: Readonly<Record<string, CustomElementConstructor>> = {
  "ocelle-plant-no-wait": withAnnouncer(NoWait),
  "ocelle-plant-no-restart": withAnnouncer(NoRestart),
  "ocelle-plant-no-minimum-hold": withAnnouncer(NoMinimumHold),
  "ocelle-plant-no-recheck": withAnnouncer(NoRecheck),
  "ocelle-plant-keeps-baseline": withAnnouncer(KeepsBaseline),
  "ocelle-plant-short-hold": withAnnouncer(ShortHold),
  "ocelle-plant-late-write": withAnnouncer(LateWrite),
  "ocelle-plant-microtask-write": withAnnouncer(MicrotaskWrite),
  "ocelle-plant-frame-write": withAnnouncer(FrameWrite),
  "ocelle-plant-raw-baseline": withAnnouncer(RawBaseline),
  "ocelle-plant-alert-copies": AlertCopies,
  "ocelle-plant-alert-baseline-now": AlertBaselineNow,
  "ocelle-plant-alert-pending-role": AlertPendingRole,
  "ocelle-plant-alert-step-after-reset": AlertStepAfterReset,
  "ocelle-plant-always-polite": AlwaysPolite,
  "ocelle-plant-any-tone": AnyTone,
  "ocelle-plant-ignores-hidden": IgnoresHidden,
  "ocelle-plant-nested-region": NestedRegion,
  "ocelle-plant-host-region": HostRegion,
  "ocelle-plant-heading-always": HeadingAlways,
  "ocelle-plant-constructed-connected": ConstructedConnected,
  "ocelle-plant-never-first-load": NeverFirstLoad,
  "ocelle-plant-no-move": NoMove,
  "ocelle-plant-move-forever": MoveForever,
  "ocelle-plant-deaf-after-first-load": DeafAfterFirstLoad,
};
