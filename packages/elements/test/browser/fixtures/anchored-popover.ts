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
`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];

const outside = document.querySelector("#outside");
outside?.addEventListener("click", () => {
  const count = Number(outside.getAttribute("data-activations") ?? "0");
  outside.setAttribute("data-activations", String(count + 1));
});
