// The firstLoad page's parser-blocking script (specs/010-feedback-forms phase 2; contracts/testing.md § Driver steps):
// it runs while the parser is inside the page's container and writes the markup the driver gave through
// globalThis.ocelleFirstLoad before navigation, so the parser inserts it while document.readyState is "loading", as a
// server's HTML would be; the page's module scripts, which run after parsing, then upgrade the elements by the
// registration of their definitions. Without a given markup it writes nothing.
const given = globalThis.ocelleFirstLoad;
if (given !== undefined) document.write(given.markup);
