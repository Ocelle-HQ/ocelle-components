import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/ocelle-icon.ts";
import { afterTask } from "../src/live.ts";
import "../src/ocelle-notice.ts";
import type { OcelleNotice } from "../src/ocelle-notice.ts";

// The notice's rules one at a time (specs/010-feedback-forms FR-004 to FR-011, research.md R-02, data-model.md
// § Notice and § Announcement transitions; T025's phase-end mutation run): each test drives one rule of
// src/ocelle-notice.ts through the DOM and reads the copy and the politeness of the notice's own live region (the
// atomic `div` after its box) under fake timers. The scenarios of scenarios/notice.ts count announcements through the
// capture, where the end-of-wait re-check and an `aria-live="off"` region hide a rule that does not hold; here the
// region's copy and the wait's timing are read directly. This file does not import test/in-process.ts, so the timing in
// force is the shipped one (`W` = 300 ms once the document is complete, 700 ms while it loads, `H` = 5000 ms), on a
// fake clock that moves only when a test advances it.
const W = 300;
const H = 5000;

/** The end of the current task: the `MutationObserver` records, Lit's update and the end-of-task steps posted before. */
const endOfTask = (): Promise<void> =>
  new Promise((resolve) => {
    afterTask(resolve);
  });

let container: HTMLElement;

function notice(id = "n"): OcelleNotice {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id}`);
  return found as OcelleNotice;
}

/** The notice's live region, the atomic `div` of its shadow root. */
function region(of: OcelleNotice): Element {
  const found = of.shadowRoot?.querySelector('[aria-atomic="true"]');
  if (found === undefined || found === null) throw new Error("no live region");
  return found;
}

const copy = (of: OcelleNotice = notice()): string | null => region(of).textContent;
const live = (of: OcelleNotice = notice()): string | null => region(of).getAttribute("aria-live");

/** Inserts `markup` after load (not a first load) and ends the task. */
async function insert(markup: string): Promise<OcelleNotice> {
  container.innerHTML = markup;
  await endOfTask();
  return notice();
}

/** The copy written for `markup` W after its insertion. */
async function written(markup: string): Promise<string | null> {
  const inserted = await insert(markup);
  vi.advanceTimersByTime(W);
  return copy(inserted);
}

/** A notice whose region holds `text`, written W after its insertion; the hold has `H` - 0 ms to run. */
async function holding(attributes: string, text: string): Promise<OcelleNotice> {
  const inserted = await insert(`<ocelle-notice id="n" ${attributes}>${text}</ocelle-notice>`);
  vi.advanceTimersByTime(W);
  return inserted;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  container = document.createElement("main");
  document.body.append(container);
});

afterEach(async () => {
  container.remove();
  await endOfTask();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the text a notice announces (FR-008)", () => {
  it("counts an img's alt as if surrounded by spaces and an img without alt as nothing, and leaves comments out", async () => {
    await expect(written('<ocelle-notice id="n" announce><img alt="Warning">Disk<img> full<!-- not read --></ocelle-notice>')).resolves.toBe("Warning Disk full");
  });

  it("leaves out hidden and aria-hidden children, script and style, and keeps an aria-hidden=false child", async () => {
    await expect(
      written('<ocelle-notice id="n" announce><span hidden>No</span><span aria-hidden="true">No</span><span aria-hidden="false">Kept</span><script type="text/plain">no()</script><style>.no {}</style> text</ocelle-notice>'),
    ).resolves.toBe("Kept text");
  });

  it("leaves out the children appended to a template element", async () => {
    const made = document.createElement("ocelle-notice");
    made.id = "n";
    made.toggleAttribute("announce", true);
    const template = document.createElement("template");
    template.append(Object.assign(document.createElement("span"), { textContent: "No" }));
    made.append(template, " Body");
    container.append(made);
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(made)).toBe("Body");
  });

  it("joins an element's children with nothing between them", async () => {
    await expect(written('<ocelle-notice id="n" announce><span><b>Up</b><b>load</b></span> done</ocelle-notice>')).resolves.toBe("Upload done");
  });

  it("reads the heading elements joined by a space, then the body, with a slot=\"\" child in the body and a child of another slot left out", async () => {
    await expect(
      written('<ocelle-notice id="n" announce><b slot="heading">One</b><b slot="heading">Two</b><span slot="">Body</span><span slot="other">No</span> end</ocelle-notice>'),
    ).resolves.toBe("One Two Body end");
  });

  it("reads an ocelle-icon's label property, or its label attribute when the property is not a string, or nothing", async () => {
    const inserted = await insert(
      '<ocelle-notice id="n" announce><ocelle-icon id="a" name="arrow-end" label="Attr"></ocelle-icon><ocelle-icon id="b" name="arrow-end" label="Kept"></ocelle-icon><ocelle-icon name="arrow-end"></ocelle-icon>end</ocelle-notice>',
    );
    (notice("a") as HTMLElement & { label?: unknown }).label = "Prop";
    (notice("b") as HTMLElement & { label?: unknown }).label = undefined;
    vi.advanceTimersByTime(W);
    expect(copy(inserted)).toBe("Prop Kept end");
  });
});

describe("the host role (FR-009)", () => {
  it("reads the role's first token after leading whitespace: role=\" status\" announces politely", async () => {
    const inserted = await insert('<ocelle-notice id="n" role=" status">Saved</ocelle-notice>');
    vi.advanceTimersByTime(W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "polite", copy: "Saved" });
  });
});

describe("the properties (contracts/elements.md)", () => {
  it("tone, size and announce set their attributes", async () => {
    const inserted = await insert('<ocelle-notice id="n">Saved</ocelle-notice>');
    inserted.tone = "danger";
    inserted.size = "compact";
    inserted.announce = true;
    const set = { tone: inserted.getAttribute("tone"), size: inserted.getAttribute("size"), announce: inserted.hasAttribute("announce") };
    inserted.announce = false;
    expect({ set, removed: inserted.hasAttribute("announce") }).toEqual({ set: { tone: "danger", size: "compact", announce: true }, removed: false });
  });

  it("writes no attribute for the default while it is absent or for the value it holds, writes the default over an unknown value, and removes it for null", async () => {
    const inserted = await insert('<ocelle-notice id="n" size="huge">Saved</ocelle-notice>');
    const records: string[] = [];
    const observer = new MutationObserver((list) => {
      records.push(...list.map((record) => record.attributeName ?? ""));
    });
    observer.observe(inserted, { attributes: true });
    inserted.tone = "info";
    inserted.size = "regular";
    inserted.size = "regular";
    inserted.tone = "warning";
    (inserted as unknown as { tone: string | null }).tone = null;
    await endOfTask();
    const before = { records: [...records], tone: inserted.getAttribute("tone"), size: inserted.getAttribute("size") };
    (inserted as unknown as { size: string | null }).size = null;
    await endOfTask();
    observer.disconnect();
    expect({ before, size: inserted.getAttribute("size") }).toEqual({ before: { records: ["size", "tone", "tone"], tone: null, size: "regular" }, size: null });
  });
});

describe("first load and removal (R-02)", () => {
  it("a notice never connected writes nothing for a change of its text", async () => {
    const made = document.createElement("ocelle-notice");
    made.toggleAttribute("announce", true);
    made.textContent = "A";
    await endOfTask();
    made.textContent = "B";
    await endOfTask();
    vi.advanceTimersByTime(W);
    container.append(made);
    await endOfTask();
    expect({ live: live(made), copy: copy(made) }).toEqual({ live: "polite", copy: "" });
  });


  it("connected while the document loads is a first load: the region is live and nothing is written", async () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const inserted = await insert('<ocelle-notice id="n" announce>Saved</ocelle-notice>');
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "polite", copy: "" });
  });

  it("removed and not put back in the same task, the copy is emptied in the next task; moved, it stays", async () => {
    container.innerHTML = '<ocelle-notice id="m" announce>Moved</ocelle-notice><ocelle-notice id="r" announce>Removed</ocelle-notice>';
    await endOfTask();
    vi.advanceTimersByTime(W);
    const moved = notice("m");
    const removed = notice("r");
    removed.remove();
    moved.remove();
    container.append(moved);
    const atRemoval = copy(removed);
    await endOfTask();
    expect({ atRemoval, removed: copy(removed), moved: copy(moved) }).toEqual({ atRemoval: "Removed", removed: "", moved: "Moved" });
  });

  it("moved with its announce removed while out of the document, the region goes off", async () => {
    const inserted = await holding("announce", "Saved");
    inserted.remove();
    inserted.removeAttribute("announce");
    container.append(inserted);
    await endOfTask();
    expect(live(inserted)).toBe("off");
  });
});

describe("hidden (FR-010)", () => {
  it("set empties the held copy at once", async () => {
    const inserted = await holding("announce", "Saved");
    vi.advanceTimersByTime(10);
    inserted.hidden = true;
    expect(copy(inserted)).toBe("");
  });

  it("removed from a notice that does not announce writes nothing", async () => {
    const inserted = await insert('<ocelle-notice id="n" hidden>Saved</ocelle-notice>');
    inserted.hidden = false;
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "off", copy: "" });
  });
});

describe("announce set and removed", () => {
  it("removed empties the held copy at once", async () => {
    const inserted = await holding("announce", "Saved");
    vi.advanceTimersByTime(10);
    inserted.removeAttribute("announce");
    expect(copy(inserted)).toBe("");
  });

  it("removed from a role=\"status\" notice leaves its copy, the role deciding alone", async () => {
    const inserted = await holding('announce role="status"', "Saved");
    vi.advanceTimersByTime(10);
    inserted.removeAttribute("announce");
    await endOfTask();
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "polite", copy: "Saved" });
  });

  it("set takes the baseline then: a change back to the text it had before announcing is announced", async () => {
    const inserted = await insert('<ocelle-notice id="n">A</ocelle-notice>');
    inserted.textContent = "B";
    await endOfTask();
    inserted.announce = true;
    await endOfTask();
    inserted.textContent = "A";
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(inserted)).toBe("A");
  });
});

describe("the host role changed (US1-15)", () => {
  it("to status takes the baseline then: a change back to the text it had before announcing is announced", async () => {
    const inserted = await insert('<ocelle-notice id="n">A</ocelle-notice>');
    inserted.textContent = "B";
    await endOfTask();
    inserted.setAttribute("role", "status");
    await endOfTask();
    inserted.textContent = "A";
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(inserted)).toBe("A");
  });

  it("removed from a role=\"status\" notice empties the held copy at once", async () => {
    const inserted = await holding('role="status"', "Saved");
    vi.advanceTimersByTime(10);
    inserted.removeAttribute("role");
    expect(copy(inserted)).toBe("");
  });

  it("changed while hidden writes nothing, even when the politeness changes", async () => {
    const inserted = await insert('<ocelle-notice id="n" announce tone="danger" role="status" hidden>Failed</ocelle-notice>');
    inserted.removeAttribute("role");
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "assertive", copy: "" });
  });

  it("from status to note on an announcing notice, the politeness unchanged, does not restart a running wait", async () => {
    const inserted = await holding('announce role="status"', "A");
    vi.advanceTimersByTime(H);
    inserted.textContent = "B";
    await endOfTask();
    vi.advanceTimersByTime(W / 2);
    inserted.setAttribute("role", "note");
    await endOfTask();
    vi.advanceTimersByTime(W / 2);
    expect(copy(inserted)).toBe("B");
  });

  it("from status to alert cancels a running wait", async () => {
    const inserted = await insert('<ocelle-notice id="n" role="status">Saved</ocelle-notice>');
    vi.advanceTimersByTime(W / 2);
    inserted.setAttribute("role", "alert");
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "assertive", copy: "" });
  });

  it("from status to alert and back in one task writes nothing when the text and politeness are the baseline's", async () => {
    const inserted = await holding('role="status"', "Saved");
    vi.advanceTimersByTime(H);
    inserted.setAttribute("role", "alert");
    inserted.setAttribute("role", "status");
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "polite", copy: "" });
  });

  it("from status to alert and back in one task, the text changed meanwhile, writes the new text", async () => {
    const inserted = await holding('role="status"', "Saved");
    vi.advanceTimersByTime(H);
    inserted.setAttribute("role", "alert");
    inserted.textContent = "Changed";
    // The light-DOM change is delivered while the alert baseline is pending, then the role changes back, in one task.
    await Promise.resolve();
    inserted.setAttribute("role", "status");
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(inserted)).toBe("Changed");
  });

  it("from status to alert and to note in one task, the tone's politeness differing from the baseline's, writes the text", async () => {
    const inserted = await holding('announce tone="danger" role="status"', "Failed");
    vi.advanceTimersByTime(H);
    inserted.setAttribute("role", "alert");
    inserted.setAttribute("role", "note");
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "assertive", copy: "Failed" });
  });

  it("set to alert and then to status in one task on a notice that did not announce takes the baseline: nothing is written", async () => {
    const inserted = await insert('<ocelle-notice id="n">Saved</ocelle-notice>');
    inserted.setAttribute("role", "alert");
    inserted.setAttribute("role", "status");
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "polite", copy: "" });
  });

  it("set to alert on a notice that did not announce, its text changed in the same task, writes nothing", async () => {
    const inserted = await insert('<ocelle-notice id="n">A</ocelle-notice>');
    inserted.setAttribute("role", "alert");
    inserted.textContent = "B";
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "assertive", copy: "" });
  });

  it("set to status on a notice that did not announce, its text changed in the same task, writes the new text", async () => {
    const inserted = await insert('<ocelle-notice id="n">A</ocelle-notice>');
    inserted.setAttribute("role", "status");
    inserted.textContent = "B";
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(inserted)).toBe("B");
  });
});

describe("a role=\"alert\" notice inserted (US1-15)", () => {
  it("changed in the same task to a role that keeps it announcing at the same politeness announces its text as an insertion", async () => {
    container.innerHTML = '<ocelle-notice id="n" announce tone="danger" role="alert">Failed</ocelle-notice>';
    notice().setAttribute("role", "note");
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect({ live: live(), copy: copy() }).toEqual({ live: "assertive", copy: "Failed" });
  });


  it("its text changed in the same task writes nothing", async () => {
    container.innerHTML = '<ocelle-notice id="n" role="alert">A</ocelle-notice>';
    notice().textContent = "B";
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(), copy: copy() }).toEqual({ live: "assertive", copy: "" });
  });
});

describe("the tone changed (US1-12)", () => {
  it("on a notice that does not announce writes nothing", async () => {
    const inserted = await insert('<ocelle-notice id="n">Saved</ocelle-notice>');
    inserted.tone = "danger";
    await endOfTask();
    vi.advanceTimersByTime(10 * W);
    expect({ live: live(inserted), copy: copy(inserted) }).toEqual({ live: "off", copy: "" });
  });

  it("on an announcing notice, the politeness unchanged, does not restart a running wait", async () => {
    const inserted = await holding("announce", "A");
    vi.advanceTimersByTime(H);
    inserted.textContent = "B";
    await endOfTask();
    vi.advanceTimersByTime(W / 2);
    inserted.tone = "success";
    await endOfTask();
    vi.advanceTimersByTime(W / 2);
    expect(copy(inserted)).toBe("B");
  });
});

describe("a host attribute that is not observed", () => {
  it("changed during the insertion's wait does not restart it", async () => {
    const inserted = await insert('<ocelle-notice id="n" announce>Saved</ocelle-notice>');
    vi.advanceTimersByTime(W / 2);
    inserted.setAttribute("data-step", "2");
    await endOfTask();
    vi.advanceTimersByTime(W / 2);
    expect(copy(inserted)).toBe("Saved");
  });
});
