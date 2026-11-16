// The layout-settle wait of the shared scenario bodies (013 research.md R-02, contracts/checks.md § Oracles "Layout
// settle"; operator decision "(a) Defer + 2-frame wait", 2026-11-14; tasks.md T003), used by both drivers: the
// in-process driver calls it, the fixture driver passes it to `page.evaluate`, so it is self-contained (no import, no
// outer name). `ocelle-facts` runs its measure pass from its `ResizeObserver` one animation frame after the callback,
// so a wait that compares from the first frame can read the layout from before that pass (phase 1 spike § 3, § 9).
// After every `ocelle-*` element's update, each read is taken after a frame's rendering (an animation frame, then a
// task), so the frame's `ResizeObserver` delivery, and any frame it schedules, come before the next read; the wait
// returns at the earliest on the second frame, when two consecutive reads agree and no element has an update pending,
// and rejects after 10 frames.

/** Waits for the layout of the element with `id` (its border box and its shadow root's first `dl`) to settle; resolves with the frames waited. */
export async function layoutWait(id: string): Promise<number> {
  const limit = 10;
  type Updating = Element & { readonly updateComplete?: Promise<unknown>; readonly isUpdatePending?: boolean };
  const elements = (): Updating[] => [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
  await Promise.all(elements().map((each) => each.updateComplete ?? Promise.resolve()));
  const read = (): string => {
    const host = document.getElementById(id);
    if (host === null) throw new Error(`no #${id} on the page`);
    const list = host.shadowRoot?.querySelector("dl") ?? null;
    const rects = [host.getBoundingClientRect(), ...(list === null ? [] : [list.getBoundingClientRect()])];
    return JSON.stringify(rects.map((rect) => [rect.x, rect.y, rect.width, rect.height]));
  };
  let previous: string | undefined;
  for (let frame = 1; frame <= limit; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const now = read();
    if (frame >= 2 && now === previous && elements().every((each) => each.isUpdatePending !== true)) return frame;
    previous = now;
  }
  throw new Error(`layout: #${id} did not settle in ${String(limit)} frames`);
}
