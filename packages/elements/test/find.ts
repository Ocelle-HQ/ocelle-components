// The page side of the driver's `findInPage` (018 phase 3, tasks.md T024; research.md R-05, contracts/checks.md § US2
// bodies, find in page): the browser's find in page, `window.find`, run from the start of the document until it finds
// no further match, each match read from the selection it leaves. A match inside a shadow root is read through
// `getComposedRanges` with every open shadow root of the page, so its start is the node it lies in, not the host the
// document's selection is rescoped to. Self-contained (no import, no outer name), so the fixture driver can pass it to
// `page.evaluate` and the in-process driver call it in place.
import type { FindMatch } from "./scenarios/driver.ts";

/** Every match of `text` that find in page reaches from the start of the document, in order (at most 20). */
export function findMatchesOf(text: string): FindMatch[] {
  const selection = document.getSelection();
  if (selection === null) throw new Error("find: the document has no selection");
  const roots: ShadowRoot[] = [];
  const collect = (root: Document | ShadowRoot): void => {
    for (const element of root.querySelectorAll("*")) {
      if (element.shadowRoot !== null) {
        roots.push(element.shadowRoot);
        collect(element.shadowRoot);
      }
    }
  };
  collect(document);
  selection.removeAllRanges();
  const start = document.createRange();
  start.setStart(document.body, 0);
  start.collapse(true);
  selection.addRange(start);
  const find = (window as unknown as { find: (value: string, caseSensitive: boolean, backwards: boolean, wrapAround: boolean) => boolean }).find;
  const composed = selection as unknown as { getComposedRanges: (options: { readonly shadowRoots: readonly ShadowRoot[] }) => StaticRange[] };
  const matches: FindMatch[] = [];
  while (matches.length < 20 && find.call(window, text, false, false, false)) {
    const [range] = composed.getComposedRanges({ shadowRoots: roots });
    const node = range?.startContainer ?? null;
    const holder = node === null ? null : node instanceof Element ? node : node.parentElement;
    if (holder === null) throw new Error("find: a match with no element around it");
    const box = holder.getBoundingClientRect();
    const name = holder.getRootNode() instanceof ShadowRoot && holder.className !== "" ? `.${holder.className}` : holder.id !== "" ? `#${holder.id}` : holder.localName;
    matches.push({ holder: name, text: range === undefined ? "" : String(range.startContainer.textContent).slice(range.startOffset, range.startContainer === range.endContainer ? range.endOffset : undefined), box: [box.width, box.height] });
  }
  selection.removeAllRanges();
  return matches;
}
