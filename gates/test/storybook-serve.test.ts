import { describe, expect, it } from "vitest";
import { contentType, servedFile } from "../lib/storybook-serve.ts";

// The local server over a built Storybook (research.md R-04, R-08): which file of dist/ a request path names, and its
// content type. The server itself is run by the visual gate's integration tests.
describe("servedFile", () => {
  it("names the file of dist a request path names, query and fragment dropped, percent-escapes decoded", () => {
    expect(servedFile("/r/storybook/dist", "/iframe.html?id=a--b&viewMode=story")).toBe("/r/storybook/dist/iframe.html");
    expect(servedFile("/r/storybook/dist", "/fonts/SchibstedGrotesk-wght.woff2#x")).toBe("/r/storybook/dist/fonts/SchibstedGrotesk-wght.woff2");
    expect(servedFile("/r/storybook/dist", "/assets/a%20b.js")).toBe("/r/storybook/dist/assets/a b.js");
    expect(servedFile("/r/storybook/dist", "/")).toBe("/r/storybook/dist/iframe.html");
  });

  it("names nothing outside dist: dot segments, an escaped slash leaving it, a bad escape", () => {
    expect(servedFile("/r/storybook/dist", "/../package.json")).toBeUndefined();
    expect(servedFile("/r/storybook/dist", "/assets/%2e%2e/%2e%2e/x")).toBeUndefined();
    expect(servedFile("/r/storybook/dist", "/%E0%A4%A")).toBeUndefined();
    expect(servedFile("/r/storybook/dist", "/a/../b.js")).toBe("/r/storybook/dist/b.js");
    expect(servedFile("/r/storybook/dist", "/..")).toBeUndefined();
    expect(servedFile("/r/storybook/dist", "/a/../..?x=1")).toBeUndefined();
    expect(servedFile("/r/storybook/dist", "iframe.html")).toBeUndefined();
    expect(servedFile("/r/storybook/dist", "/index.json?a=1#b?c")).toBe("/r/storybook/dist/index.json");
  });
});

describe("contentType", () => {
  it("gives each file type of a Storybook build its type, and octet-stream otherwise", () => {
    expect(["a.html", "a.js", "a.css", "a.json", "a.woff2", "a.png", "a.svg", "a.map", "a.bin", "a"].map(contentType)).toEqual([
      "text/html; charset=utf-8",
      "text/javascript; charset=utf-8",
      "text/css; charset=utf-8",
      "application/json; charset=utf-8",
      "font/woff2",
      "image/png",
      "image/svg+xml",
      "application/json; charset=utf-8",
      "application/octet-stream",
      "application/octet-stream",
    ]);
  });
});
