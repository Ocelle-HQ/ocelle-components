import { afterEach, describe, expect, it, vi } from "vitest";
import preview from "../../.storybook/preview.ts";

// The preview configuration (FR-023, research.md R-10, reviews/phase-3/spike.md): a theme global, light at start,
// offered in the toolbar and settable by URL (`globals=theme:dark`); a decorator sets data-theme on the preview's
// <html> from it before the story renders, so the token stylesheet shows that theme.
afterEach(() => {
  vi.unstubAllGlobals();
});

type Decorator = (story: () => unknown, context: { readonly globals: Readonly<Record<string, unknown>> }) => unknown;

function decorate(globals: Readonly<Record<string, unknown>>): { readonly theme: string | undefined; readonly rendered: unknown; readonly calls: number } {
  const root = { dataset: {} as Record<string, string> };
  vi.stubGlobal("document", { documentElement: root });
  const decorators = (Array.isArray(preview.decorators) ? preview.decorators : [preview.decorators]) as Decorator[];
  expect(decorators).toHaveLength(1);
  let calls = 0;
  const rendered = decorators[0]?.(() => {
    calls += 1;
    return root.dataset.theme;
  }, { globals });
  return { theme: root.dataset.theme, rendered, calls };
}

describe("preview.ts", () => {
  it("declares the theme global with light and dark in the toolbar, light at start", () => {
    expect(preview.globalTypes).toEqual({ theme: { description: "Theme of the token stylesheet", toolbar: { title: "Theme", items: ["light", "dark"] } } });
    expect(preview.initialGlobals).toEqual({ theme: "light" });
  });

  it("sets data-theme on <html> from the theme global before the story renders, and returns the story", () => {
    expect(decorate({ theme: "dark" })).toEqual({ theme: "dark", rendered: "dark", calls: 1 });
    expect(decorate({ theme: "light" })).toEqual({ theme: "light", rendered: "light", calls: 1 });
  });

  it("sets data-theme light when the global is missing or not a theme", () => {
    expect(decorate({})).toEqual({ theme: "light", rendered: "light", calls: 1 });
    expect(decorate({ theme: "sepia" })).toEqual({ theme: "light", rendered: "light", calls: 1 });
  });
});
