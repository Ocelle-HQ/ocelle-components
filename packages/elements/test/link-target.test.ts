import { describe, expect, it } from "vitest";
import { navigationTarget } from "../src/link-target.ts";

// The link's navigation decision (014 FR-047; research.md R-08; data-model.md § Link state; T092), plain cases with no
// DOM, in the in-process `elements` project that the elements Stryker configuration runs (R-13).
// `navigationTarget(href, baseURI, documentProtocol)` resolves `href` against `baseURI` and returns the resolved URL
// when its protocol is `http:`, `https:` or `documentProtocol`; it returns null for a null `href`, an `href` that does
// not parse, and any other protocol. The check is on the resolved URL, never on the written string or on the document's
// URL, so padding and a tab inside the scheme do not bypass it (US5-9), a protocol-relative `href` takes the base's
// protocol (US5-10), a custom-scheme base makes every relative `href` that scheme (US5-11), a `file:` document allows
// its own protocol (US5-12), `""` resolves to the base without its fragment and a fragment to the base with it
// (US5-14). Every refused case is paired in its test with an allowed case whose URL is returned, so no test holds when
// the function returns null for every input. Every expected URL is written by hand from the URL standard.
const page = "http://127.0.0.1:4173/link.html";

describe("navigationTarget: the allowed protocols", () => {
  it.each([
    { href: "link-target.html", expected: "http://127.0.0.1:4173/link-target.html" },
    { href: "/docs/a.html?x=1#y", expected: "http://127.0.0.1:4173/docs/a.html?x=1#y" },
    { href: "https://example.org/a", expected: "https://example.org/a" },
    { href: "HTTPS://Example.org/a", expected: "https://example.org/a" },
    { href: "http://example.org", expected: "http://example.org/" },
  ])("$href on an http: page resolves to $expected", ({ href, expected }) => {
    expect(navigationTarget(href, page, "http:")).toBe(expected);
  });

  it("the document's own protocol is allowed: a relative href on a file: document, a kitty-app: href on a kitty-app: document (US5-12)", () => {
    expect([
      navigationTarget("link-target.html", "file:///srv/fixture/link.html", "file:"),
      navigationTarget("kitty-app://app/missions", "kitty-app://app/index.html", "kitty-app:"),
      navigationTarget("x", "kitty-app://app/", "kitty-app:"),
    ]).toEqual(["file:///srv/fixture/link-target.html", "kitty-app://app/missions", "kitty-app://app/x"]);
  });

  it("http: and https: stay allowed on a document of another protocol: an https href on a file: document and on a kitty-app: document", () => {
    expect([navigationTarget("https://example.org/a", "file:///srv/fixture/link.html", "file:"), navigationTarget("http://example.org/b", "kitty-app://app/", "kitty-app:")]).toEqual([
      "https://example.org/a",
      "http://example.org/b",
    ]);
  });
});

describe("navigationTarget: refused protocols, each beside an allowed href on the same page (US5-9)", () => {
  it.each([
    { name: "javascript:", href: "javascript:alert(1)" },
    { name: "javascript: padded with spaces", href: " javascript:alert(1)" },
    { name: "javascript: padded with a newline and spaces", href: "\n  javascript:alert(1)  " },
    { name: "javascript: with a tab inside the scheme", href: "java\tscript:alert(1)" },
    { name: "javascript: with a newline inside the scheme", href: "java\nscript:alert(1)" },
    { name: "JAVASCRIPT: in capitals", href: "JAVASCRIPT:alert(1)" },
    { name: "data:", href: "data:text/html,x" },
    { name: "a custom scheme that is not the document's", href: "kitty-app://app/x" },
    { name: "mailto:", href: "mailto:someone@example.org" },
    { name: "blob:", href: "blob:http://127.0.0.1:4173/0f0f" },
  ])("$name is null, and link-target.html on the same page is its URL", ({ href }) => {
    expect([navigationTarget(href, page, "http:"), navigationTarget("link-target.html", page, "http:")]).toEqual([null, "http://127.0.0.1:4173/link-target.html"]);
  });

  it("a file: href is refused on an http: page and allowed on a file: page (the decision reads documentProtocol, not the href's own scheme)", () => {
    expect([navigationTarget("file:///etc/hosts", page, "http:"), navigationTarget("file:///etc/hosts", "file:///srv/fixture/link.html", "file:")]).toEqual([null, "file:///etc/hosts"]);
  });

  it("a null href is null, beside the same page's allowed href", () => {
    expect([navigationTarget(null, page, "http:"), navigationTarget("link-target.html", page, "http:")]).toEqual([null, "http://127.0.0.1:4173/link-target.html"]);
  });

  it("an href that does not parse is null and throws nothing, beside one that does", () => {
    expect([navigationTarget("http://[::1", page, "http:"), navigationTarget("https://example.org:99999/", page, "http:"), navigationTarget("http://[::1]/", page, "http:")]).toEqual([null, null, "http://[::1]/"]);
  });
});

describe("navigationTarget: resolution against the base, not the written string or the document URL", () => {
  it("a protocol-relative href takes the base's http: protocol (US5-10), and on a file: base the file: protocol", () => {
    expect([navigationTarget("//127.0.0.1:4173/link-target.html", page, "http:"), navigationTarget("//host/share/a.html", "file:///srv/fixture/link.html", "file:")]).toEqual([
      "http://127.0.0.1:4173/link-target.html",
      "file://host/share/a.html",
    ]);
  });

  it("a kitty-app: base on an http: page refuses a relative href and allows an absolute https: one; without the base the relative href is allowed (US5-11)", () => {
    expect([navigationTarget("x", "kitty-app://app/", "http:"), navigationTarget("https://example.org/x", "kitty-app://app/", "http:"), navigationTarget("x", page, "http:")]).toEqual([
      null,
      "https://example.org/x",
      "http://127.0.0.1:4173/x",
    ]);
  });

  it("a base with another path resolves the href against it, not against the page", () => {
    expect(navigationTarget("guide.html", "http://127.0.0.1:4173/docs/start/", "http:")).toBe("http://127.0.0.1:4173/docs/start/guide.html");
  });

  it('"" resolves to the base without its fragment, and a fragment to the base with that fragment (US5-14)', () => {
    expect([navigationTarget("", `${page}#top`, "http:"), navigationTarget("#section-2", `${page}#top`, "http:"), navigationTarget("?q=1", page, "http:")]).toEqual([
      page,
      `${page}#section-2`,
      "http://127.0.0.1:4173/link.html?q=1",
    ]);
  });
});
