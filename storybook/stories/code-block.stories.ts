// The ocelle-code-block stories (020 spec US2, FR-050; research.md R-09; tasks.md T028): a short command, a long line
// wrapping in a 288 px frame, an overflowing scroll block at its start, in the middle and at its end, a focused scroll
// block (a wrapper that focuses the scroll box once it has rendered, as the disclosure's focused story does), a scroll
// block that fits, a digest, a digest wrapping in the 288 px frame, a digest in a scroll block, right to left in wrap
// and in scroll mode, an empty block, and an overflowing scroll block with no label (operator decision on T021a,
// reviews/phase-2/operator-axe-decision.md), in light and dark through the preview's theme global. Every other scroll
// story has a `label`; no story sets a host `aria-label` on a code block (FR-026; the wrap-mode host `aria-label` has no
// story, plan Complexity Tracking). The 288 px frame is a `data-story` rule of stories-layout.css, so the markup has no
// style attribute. The middle and end stories set the scroll position after the element's `updateComplete`, inside
// their render, and hold their share of the range when it changes (a font that loads late), as the scroller's do; the
// right-to-left scroll story loads the sans face before it renders (a loader), so the element's own opening write at
// its first layout is what it shows. The element is imported from the package source by relative path, as the other
// element stories import theirs.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-code-block.ts";

const meta: Meta = { title: "Elements/ocelle-code-block" };
export default meta;

/** The deploy command of the scroll stories, longer than the 288 px frame. */
const command = "docker compose --file deploy/compose.production.yaml --project-name ocelle-components up --detach --remove-orphans";
/** A log line with no space, longer than the 288 px frame. */
const logLine = "2026-11-21T09:14:03.512Z/worker-3/mission-020/phase-2/build/elements/ocelle-code-block/step-17/ok";
/** The SHA-256 of `test`, as a mission commit digest. */
const digest = "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";

/** A code block with its attributes and text, in the 288 px frame when `narrow`. */
function block(text: string, attributes = "", narrow = false): string {
  const element = `<ocelle-code-block${attributes}>${text}</ocelle-code-block>`;
  return narrow ? `<div data-story="code-block-narrow">${element}</div>` : element;
}

/** A story-only wrapper that focuses the scroll box of the `ocelle-code-block` it holds once that has rendered. */
class StoryCodeBlockFocus extends HTMLElement {
  connectedCallback(): void {
    void customElements.whenDefined("ocelle-code-block").then(async () => {
      const codeBlock = this.querySelector("ocelle-code-block");
      if (codeBlock === null) return;
      await codeBlock.updateComplete;
      codeBlock.shadowRoot?.querySelector<HTMLElement>(".region-box")?.focus();
    });
  }
}
if (customElements.get("story-code-block-focus") === undefined) customElements.define("story-code-block-focus", StoryCodeBlockFocus);

/**
 * An overflowing scroll block, scrolled after its first update to a share of its scroll range (0 is the start, 1 the
 * end), and scrolled to that share of the new range again whenever its scroll range changes.
 */
function scrolled(share: number): HTMLElement {
  const story = document.createElement("div");
  story.innerHTML = block(command, ' overflow="scroll" label="Deploy command"', true);
  const codeBlock = story.querySelector("ocelle-code-block");
  void codeBlock?.updateComplete.then(() => {
    const box = codeBlock.shadowRoot?.querySelector(".region-box");
    if (box === null || box === undefined) return;
    let range = box.scrollWidth - box.clientWidth;
    box.scrollLeft = Math.round(range * share);
    const hold = new ResizeObserver(() => {
      const now = box.scrollWidth - box.clientWidth;
      if (now === range) return;
      range = now;
      box.scrollLeft = Math.round(range * share);
    });
    hold.observe(box);
    const track = box.querySelector(".region-track");
    if (track !== null) hold.observe(track);
  });
  return story;
}

export const Short: StoryObj = { render: () => block("git push origin main") };

export const WrapLongLine: StoryObj = { name: "Wrap long line", render: () => block(logLine, "", true) };

export const ScrollOverflowing: StoryObj = { name: "Scroll overflowing", render: () => block(command, ' overflow="scroll" label="Deploy command"', true) };

export const ScrollMiddle: StoryObj = { name: "Scroll middle", render: () => scrolled(0.5) };

export const ScrollEnd: StoryObj = { name: "Scroll end", render: () => scrolled(1) };

export const ScrollFocused: StoryObj = {
  name: "Scroll focused",
  render: () => `<story-code-block-focus>${block(command, ' overflow="scroll" label="Deploy command"', true)}</story-code-block-focus>`,
};

export const ScrollFitting: StoryObj = { name: "Scroll fitting", render: () => block("pnpm run build", ' overflow="scroll" label="Build command"') };

export const Digest: StoryObj = { render: () => block(digest, " digest") };

export const DigestWrapping: StoryObj = { name: "Digest wrapping", render: () => block(digest, " digest", true) };

export const DigestScroll: StoryObj = { name: "Digest scroll", render: () => block(digest, ' digest overflow="scroll" label="Commit digest"', true) };

export const RightToLeft: StoryObj = { name: "Right to left", render: () => `<div dir="rtl">${block("git push --force origin main.")}</div>` };

/**
 * Loads the face of `--ocelle-font-sans` before the story renders. An `rtl` scroll block is opened at its line starts
 * once, at its first layout (FR-021, no write after a resize): rendered before the web font arrives, it would open at
 * the line starts of the fallback face and keep that position when the font widens the lines.
 */
const sansLoaded = async (): Promise<Record<string, never>> => {
  await document.fonts.load(`1rem ${getComputedStyle(document.documentElement).getPropertyValue("--ocelle-font-sans")}`);
  return {};
};

export const RightToLeftScroll: StoryObj = {
  name: "Right to left scroll",
  loaders: [sansLoaded],
  render: () => `<div dir="rtl">${block(["cd /srv/app", command, "ls"].join("\n"), ' overflow="scroll" label="Deploy commands"', true)}</div>`,
};

export const Empty: StoryObj = { render: () => block("") };

export const ScrollUnlabelled: StoryObj = { name: "Scroll unlabelled", render: () => block(command, ' overflow="scroll"', true) };
