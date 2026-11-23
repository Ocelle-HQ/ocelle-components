import { afterEach, describe, expect, it, vi } from "vitest";
import type { Page } from "playwright";
import { applyPointer } from "../lib/story-page.ts";

// The pointer driver of the story page (research.md R-15), on a fake page: page.evaluate runs its function in this
// process against stubbed window, document.fonts and requestAnimationFrame globals, so the test sees the in-page steps
// (the fonts wait and each animation frame) in order with the mouse calls. 012 phase 2 review round 3 (R3-02): under
// CPU load a pressed story captured different corner anti-aliasing in its two runs when mouse.down() followed
// mouse.move() with no frame between the hover paint and the press paint, so the press waits for the fonts and two
// frames between the move and the down.

/** A fake page whose story declares the given pointer parameter on a 100 by 40 target at (10, 20). */
function fakePage(pointer: Record<string, string>, steps: string[]): Page {
  vi.stubGlobal("window", { __STORYBOOK_PREVIEW__: { currentRender: { story: { parameters: { ocelle: { pointer } } } } } });
  vi.stubGlobal("document", {
    fonts: {
      get ready(): Promise<void> {
        steps.push("fonts");
        return Promise.resolve();
      },
    },
  });
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
    steps.push("frame");
    callback();
    return 0;
  });
  const page = {
    evaluate: (callback: () => unknown) => Promise.resolve(callback()),
    locator: (selector: string) => ({
      count: () => {
        steps.push(`count ${selector}`);
        return Promise.resolve(1);
      },
      boundingBox: () => Promise.resolve({ x: 10, y: 20, width: 100, height: 40 }),
    }),
    mouse: {
      move: (x: number, y: number) => {
        steps.push(`move ${String(x)},${String(y)}`);
        return Promise.resolve();
      },
      down: () => {
        steps.push("down");
        return Promise.resolve();
      },
    },
  };
  return page as unknown as Page;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("applyPointer (research.md R-15)", () => {
  it("presses only after the fonts and two frames have settled the move (012 phase 2 review round 3, R3-02)", async () => {
    const steps: string[] = [];
    const problem = await applyPointer(fakePage({ press: "ocelle-button" }, steps), "dark");
    expect(problem).toBeUndefined();
    expect(steps).toEqual(["count ocelle-button", "move 60,40", "fonts", "frame", "frame", "down"]);
  });

  it("hovers with a move alone, never pressing", async () => {
    const steps: string[] = [];
    const problem = await applyPointer(fakePage({ hover: "ocelle-button" }, steps), "light");
    expect(problem).toBeUndefined();
    expect(steps).toEqual(["count ocelle-button", "move 60,40"]);
  });
});
