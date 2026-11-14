// The notice's announcer and the first-load and move rules (specs/010-feedback-forms research.md R-02, R-09;
// data-model.md § Announcement transitions, § Plant seams). Internal, not an entry point: not exported from index.ts
// or browser.ts and not in the manifest. Scaffold (T009a): the exports the tests import, with no behaviour.

/** The announcer's timing: Chromium's serialisation delay `D` by load state and the hold `H`, in milliseconds. */
export interface AnnouncerTiming {
  readonly delayLoaded: number;
  readonly delayLoading: number;
  readonly hold: number;
}

/** The shipped timing, from which the timing in force starts. Scaffold: a neutral value. */
export const announcerDefaults: AnnouncerTiming = { delayLoaded: 0, delayLoading: 0, hold: 0 };

/** Test only: replaces the timing in force and returns the timing it replaced. Scaffold: changes nothing. */
export function setAnnouncerTimingForTests(timing: AnnouncerTiming): AnnouncerTiming {
  void timing;
  return announcerDefaults;
}

/** The announcer of one notice or form control: a visually hidden atomic live region that receives a copy of the text. */
export class Announcer {}
