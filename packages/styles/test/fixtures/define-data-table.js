// A stand-in definition of `ocelle-data-table` with no shadow root, so the data-table rules of base.css are checked on
// a defined element as well as an undefined one (019 contracts/styles-data-table.md § Block 1).
customElements.define("ocelle-data-table", class extends HTMLElement {});
