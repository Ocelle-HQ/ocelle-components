await customElements.whenDefined("ocelle-app-shell");
const shell = document.getElementById("shell");
const skip = document.getElementById("skip");
await shell.updateComplete;
skip.target = shell.contentTarget;
document.getElementById("resize").addEventListener("click", () => {
  document.getElementById("frame").classList.add("narrow");
});
