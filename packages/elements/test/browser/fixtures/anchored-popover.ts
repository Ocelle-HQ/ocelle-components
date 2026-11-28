// Fixture layout and observable outside action, delivered as part of the real same-origin external entry.
const styles = new CSSStyleSheet();
styles.replaceSync(`
  #chrome {
    align-items: center;
    background: var(--ocelle-color-chrome);
    color: var(--ocelle-color-chrome-ink);
    display: flex;
    gap: var(--ocelle-space-3);
    padding: var(--ocelle-space-4);
  }

  #outside {
    display: block;
    margin-block-start: var(--ocelle-space-8);
  }

  #appearance-probe {
    inline-size: var(--ocelle-target-min);
    color: var(--ocelle-color-chrome-ink);
    background-color: var(--ocelle-color-chrome);
    border-color: var(--ocelle-color-chrome-muted);
    outline-color: var(--ocelle-color-focus);
    outline-width: var(--ocelle-focus-width);
    outline-style: solid;
  }

  #panel-probe {
    color: var(--ocelle-color-ink);
    background-color: var(--ocelle-color-sheet);
    border-color: var(--ocelle-color-control-border);
  }

  #chrome button:focus-visible, #outside:focus-visible {
    outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
    outline-offset: var(--ocelle-focus-offset);
  }
  #placement-fixture, html[data-placement-fixture] #interaction-fixture {
    display: none;
  }

  html[data-placement-fixture] #placement-fixture {
    display: block;
  }

  html[data-placement-fixture="large-text"] {
    font-size: 200%;
  }

  .placement-clip {
    position: fixed;
    display: grid;
    align-items: center;
    overflow: hidden;
    transform: translateZ(0);
    box-sizing: border-box;
    inline-size: 4.75rem;
    block-size: 4rem;
    padding: 0.5rem;
    background: var(--ocelle-color-chrome);
  }

  #placement-top-clip {
    inset: 24px 24px auto auto;
    justify-items: end;
  }

  #placement-bottom-clip {
    inset: auto auto 24px 24px;
    justify-items: start;
  }

  .placement-actions {
    display: grid;
    gap: 0.25rem;
    inline-size: 236px;
    max-inline-size: 100%;
  }

  .placement-actions button {
    box-sizing: border-box;
    min-block-size: var(--ocelle-target-min);
    min-inline-size: 0;
    font: 1rem / 1.25 system-ui, sans-serif;
    white-space: normal;
    overflow-wrap: anywhere;
  }

`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];

const outside = document.querySelector("#outside");
outside?.addEventListener("click", () => {
  const count = Number(outside.getAttribute("data-activations") ?? "0");
  outside.setAttribute("data-activations", String(count + 1));
});

const actions = document.querySelector<HTMLTemplateElement>("#placement-actions");
if (actions !== null) {
  for (const host of document.querySelectorAll("#placement-fixture ocelle-anchored-popover")) {
    const content = actions.content.cloneNode(true) as DocumentFragment;
    for (const button of content.querySelectorAll("button")) {
      button.addEventListener("click", (event) => {
        if (!event.isTrusted) return;
        const count = Number(button.getAttribute("data-trusted-clicks") ?? "0");
        button.setAttribute("data-trusted-clicks", String(count + 1));
      });
    }
    host.append(content);
  }
}
