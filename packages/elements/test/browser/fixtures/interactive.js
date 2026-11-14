// The insertInteractive page's module script (specs/010-feedback-forms contracts/testing.md § Driver steps; T005):
// module scripts run in order after parsing and before DOMContentLoaded, so the browser build loaded before this one
// has defined its elements when the listener below runs, while document.readyState is still "interactive". The
// listener inserts the content of the page's <template> (its markup replaced by the driver's, when the driver gave one
// through globalThis.ocelleInteractive before navigation) into the container and records the insertion on
// globalThis.ocelleInserted: its performance.now(), document.readyState, whether each custom element tag in it was
// defined at that moment, and whether each was upgraded once inserted.
document.addEventListener("DOMContentLoaded", () => {
  const given = globalThis.ocelleInteractive;
  const template = document.getElementById("insertion");
  if (given !== undefined) template.innerHTML = given.markup;
  const container = document.getElementById(given === undefined ? "c" : given.container);
  const content = template.content.cloneNode(true);
  const tags = [...content.querySelectorAll("*")].map((each) => each.localName).filter((tag) => tag.includes("-"));
  const record = { readyState: document.readyState, defined: tags.every((tag) => customElements.get(tag) !== undefined), tags };
  record.at = performance.now();
  container.append(content);
  record.upgraded = [...container.querySelectorAll("*")].filter((each) => each.localName.includes("-")).every((each) => each.matches(":defined"));
  globalThis.ocelleInserted = record;
});
