// The notice's announcer and the first-load and move helpers (specs/010-feedback-forms research.md R-02, R-09;
// data-model.md § Announcement transitions, § Plant seams). Internal, not an entry point: not exported from index.ts
// or browser.ts and not in the manifest.
//
// The announcer writes a copy of a notice's text into a live region of its own, a visually hidden atomic `div` the
// element renders after its box, which never holds the visible content. With `D` Chromium's accessibility
// serialisation delay for the document's load state (150 ms once `document.readyState` is "complete", 350 ms before)
// and the wait `W = 2 × D`, an announcement (data-model.md, *Announce*):
// 1. if the region holds a copy, waits until the copy has been current for at least `W` (the minimum hold), then
//    empties the region;
// 2. waits until the region has been empty for `W`, a trigger while waiting restarting the wait, so changes less than
//    `W` apart write only the final text;
// 3. when the wait ends, reads the text and politeness and writes nothing if the text is empty or both equal the
//    baseline (the last written text and politeness, or those current when announcing began; none after an insertion
//    or a reveal); otherwise writes the text as the copy and makes it the baseline;
// 4. holds the copy for the hold `H` (5000 ms) and then empties the region; a trigger meanwhile goes back to step 1.
// Each step is a protected method, the seam the test plants override (contracts/testing.md § Plants, Seams).

/** The live politeness of an announcement. */
export type Politeness = "polite" | "assertive";

/** What an element announces: its text, as it reads it from its content, and its politeness. */
export interface Reading {
  readonly text: string;
  readonly politeness: Politeness;
}

/** The announcer's timing: Chromium's serialisation delay `D` by load state and the hold `H`, in milliseconds. */
export interface AnnouncerTiming {
  readonly delayLoaded: number;
  readonly delayLoading: number;
  readonly hold: number;
}

/** The shipped timing, from which the timing in force starts (research.md R-01, R-02). */
export const announcerDefaults: AnnouncerTiming = { delayLoaded: 150, delayLoading: 350, hold: 5000 };

let timing: AnnouncerTiming = announcerDefaults;

/**
 * Test only (research.md R-09): replaces the timing in force and returns the timing it replaced. Only
 * packages/elements/test/in-process.ts calls it.
 */
export function setAnnouncerTimingForTests(next: AnnouncerTiming): AnnouncerTiming {
  const replaced = timing;
  timing = next;
  return replaced;
}

/** The document's load state, read in one place (the in-process tests drive it). */
export function readyState(): DocumentReadyState {
  return document.readyState;
}

const steps: (() => void)[] = [];
const channel = new MessageChannel();
channel.port1.onmessage = () => {
  steps.shift()?.();
};

/**
 * Runs `step` in a later task, through the module's `MessageChannel`: after the current task and the delivery of its
 * `MutationObserver` records (the move detection and the alert path's end-of-task baseline, research.md R-02).
 */
export function afterTask(step: () => void): void {
  steps.push(step);
  channel.port2.postMessage(0);
}

/** Whitespace collapsed and trimmed. */
export function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

type Phase = "empty" | "releasing" | "waiting" | "holding";

/** The announcer of one notice or form control: a visually hidden atomic live region that receives a copy of the text. */
export class Announcer {
  /** The live region, rendered by the element after its visible content. */
  readonly region: HTMLDivElement;
  /** Reads the element's text and politeness now. */
  protected readonly read: () => Reading;
  /** The last written text (normalised) and politeness, or those current when announcing began; null for none. */
  protected baseline: Reading | null = null;
  protected phase: Phase = "empty";
  /** Whether a wait is to start once a held copy has been emptied: set by the trigger or the alert that releases it. */
  // Stryker disable next-line BooleanLiteral: equivalent, released() reads waitNext only after the trigger() or alert() that called releaseHeld() has set it
  protected waitNext = false;
  /** When the current copy was written (`performance.now()`). */
  protected writtenAt = 0;
  protected timer: ReturnType<typeof setTimeout> | undefined;

  constructor(read: () => Reading) {
    this.read = read;
    this.region = document.createElement("div");
    this.region.className = "announcer";
    this.region.setAttribute("aria-live", "off");
    this.region.setAttribute("aria-atomic", "true");
    this.setBaseline(read());
  }

  /** Sets the region's live politeness, or `off` while the element is not announcing. */
  live(politeness: Politeness | "off"): void {
    this.region.setAttribute("aria-live", politeness);
  }

  /** The baseline becomes the current text and politeness. */
  takeBaseline(): void {
    this.setBaseline(this.read());
  }

  /** Whether `text`, normalised, is the baseline's text. */
  sameText(text: string): boolean {
    return this.baseline !== null && this.baseline.text === this.normalise(text);
  }

  /** Whether `politeness` is the baseline's politeness. */
  samePoliteness(politeness: Politeness): boolean {
    return this.baseline !== null && this.baseline.politeness === politeness;
  }

  /** An announcement: `reset` for an insertion or a reveal, which sets the baseline to none first. */
  trigger(reset: boolean): void {
    if (reset) this.forget();
    this.waitNext = true;
    if (this.phase === "releasing") return;
    if (this.phase === "holding") this.releaseHeld();
    else this.wait();
  }

  /** The alert path's cancel: no wait, and a held copy emptied once it has been current for the minimum hold. */
  alert(): void {
    this.waitNext = false;
    if (this.phase === "holding") this.releaseHeld();
    else if (this.phase === "waiting") {
      this.stop();
      this.phase = "empty";
    }
  }

  /** Cancels any pending announcement and empties the region at once. */
  cancel(): void {
    this.release();
  }

  /** The baseline step: the baseline becomes `reading`, its text normalised. */
  protected setBaseline(reading: Reading): void {
    this.baseline = { text: this.normalise(reading.text), politeness: reading.politeness };
  }

  /** The baseline becomes none. */
  protected forget(): void {
    this.baseline = null;
  }

  /** The text as it is compared and written: whitespace collapsed and trimmed. */
  protected normalise(text: string): string {
    return collapse(text);
  }

  /** `D` for the load state `state`, by default the document's now. */
  protected delay(state: "loaded" | "loading" = readyState() === "complete" ? "loaded" : "loading"): number {
    return state === "loaded" ? timing.delayLoaded : timing.delayLoading;
  }

  /** The wait `W` in force: twice `D`. */
  protected waitTime(): number {
    return 2 * this.delay();
  }

  /** How long the held copy must still stay before it may be emptied: `W` from its write. */
  protected minimumHold(): number {
    return Math.max(0, this.waitTime() - (performance.now() - this.writtenAt));
  }

  /** Step 1: empties the held copy once it has been current for the minimum hold, then waits if a trigger asks. */
  protected releaseHeld(): void {
    this.stop();
    const remaining = this.minimumHold();
    if (remaining <= 0) {
      this.released();
      return;
    }
    this.phase = "releasing";
    this.timer = setTimeout(() => {
      this.released();
    }, remaining);
  }

  /** After step 1: the region empty, and the wait started when a trigger asked for it. */
  protected released(): void {
    this.release();
    if (this.waitNext) this.wait();
  }

  /** Step 2: starts, or restarts, the wait of `W` with the region empty. */
  protected wait(): void {
    this.stop();
    this.phase = "waiting";
    this.timer = setTimeout(() => {
      this.end();
    }, this.waitTime());
  }

  /** Step 3: the end of the wait, the re-check against the baseline, then the write or nothing. */
  protected end(): void {
    // Stryker disable next-line CallExpression: equivalent, the announcer calls end() only from the wait's own timer, which has fired
    this.stop();
    this.phase = "empty";
    const { text, politeness } = this.read();
    const normalised = this.normalise(text);
    if (this.recheck(normalised, politeness)) this.write(normalised, politeness);
  }

  /** Whether the reading at the end of the wait is written: not empty, and not equal to the baseline. */
  protected recheck(text: string, politeness: Politeness): boolean {
    if (text === "") return false;
    return this.baseline?.text !== text || this.baseline.politeness !== politeness;
  }

  /** Writes `text` as the copy, makes it the baseline and holds it. */
  protected write(text: string, politeness: Politeness): void {
    this.region.textContent = text;
    this.baseline = { text, politeness };
    this.writtenAt = performance.now();
    this.phase = "holding";
    this.hold();
  }

  /** Step 4: holds the copy for `H`, then empties the region. */
  protected hold(): void {
    // Stryker disable next-line CallExpression: equivalent, the announcer calls hold() only from write(), which only end() calls, from the wait's own timer, which has fired
    this.stop();
    this.timer = setTimeout(() => {
      this.release();
    }, timing.hold);
  }

  /** Empties the region; nothing is pending afterwards. */
  protected release(): void {
    this.stop();
    this.region.textContent = "";
    this.phase = "empty";
  }

  /** Clears the running timer. */
  protected stop(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
