// The shared bodies of the driver recorders' own tests (014 research.md R-07, R-11, T003): the keydown recorder (the
// document's bubble phase), the clipboard observer (installed at every mount and on every fixture page), the record of
// an activation and the accessibility tree updates of a subtree. As in scenarios/driver-commands.ts, each body sets up
// its page with self-contained functions (`InPage`), acts through the driver and returns what it observed; the
// in-process harness (test/driver-recorders.test.ts) runs every body and the fixture harness (test/browser/driver.test.ts)
// those marked `fixture`. Each body names the planted defect it catches (reviews/phase-1/plants.md).
import type { DriverScenario } from "./driver-commands.ts";

/** Builds `#f`: a host with the light-DOM text "Go" and, in its shadow root, a `.status` text "Old"; its `status` property is "Old". */
function activationHost(mode: "deferred" | "synchronous"): void {
  const host: (HTMLElement & { status?: string }) | null = document.getElementById("f");
  if (host === null) return;
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = '<slot></slot><span class="status">Old</span>';
  host.status = "Old";
  // A click clears the status, then dispatches the request: after the next frame and a task, or at once.
  host.addEventListener("click", () => {
    const status = root.querySelector(".status");
    if (status !== null) status.textContent = "";
    host.status = "";
    const request = (): boolean => host.dispatchEvent(new CustomEvent("test-request", { bubbles: true, composed: true }));
    if (mode === "synchronous") request();
    else requestAnimationFrame(() => setTimeout(request, 0));
  });
}

/** Empties the `[role=status]` of `#w` and fills it again: after a frame and a task (`frames`), or in the same task (`task`). */
async function emptyThenFill(mode: "frames" | "task"): Promise<void> {
  const status = document.querySelector("#w [role=status]");
  if (status === null) return;
  status.textContent = "";
  if (mode === "frames") await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  status.textContent = "Copied";
}

const host = '<div id="f" class="f">Go</div>';
const hostRules = ".f { display: inline-block; inline-size: 120px; block-size: 40px; }";
const region = '<div id="w"><span role="status" aria-live="polite">Copied</span></div>';
const watched = { request: "test-request", read: ".status", property: "status" } as const;

export const driverRecorderScenarios: readonly DriverScenario[] = [
  {
    // Plant: the keydown recorder in the capture phase (it then sees ArrowDown before the input's handler prevents it).
    name: "keydownRecord gives each key and whether it was handled, as the document sees it in the bubble phase, since the last mount",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount('<input id="k" aria-label="Keys">');
      await driver.focusNode("k");
      await driver.pressKeys("x");
      await driver.mount('<input id="k" aria-label="Keys">');
      await inPage(() => {
        document.getElementById("k")?.addEventListener("keydown", (event) => {
          if (event.key === "ArrowDown") event.preventDefault();
        });
      }, null);
      await driver.focusNode("k");
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("a");
      return driver.keydownRecord();
    },
    expected: [
      { key: "ArrowDown", defaultPrevented: true },
      { key: "a", defaultPrevented: false },
    ],
  },
  {
    // Plant: the clipboard observer not wrapping `writeText` (the call is then not recorded).
    name: "clipboardCalls records navigator.clipboard.writeText without writing, and a mount starts a new list",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(host);
      const before = await driver.clipboardCalls();
      const result = await inPage(() => navigator.clipboard.writeText("secret").then((written: unknown) => String(written)), null);
      const calls = await driver.clipboardCalls();
      await driver.mount(host);
      return { before, result, calls, after: await driver.clipboardCalls() };
    },
    expected: { before: [], result: "undefined", calls: ["navigator.clipboard.writeText"], after: [] },
  },
  {
    // Plant: the clipboard observer not wrapping `write`.
    name: "clipboardCalls records navigator.clipboard.write, read and readText",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(host);
      await inPage(async () => {
        await navigator.clipboard.write([]);
        await navigator.clipboard.read();
        await navigator.clipboard.readText();
      }, null);
      return driver.clipboardCalls();
    },
    expected: ["navigator.clipboard.write", "navigator.clipboard.read", "navigator.clipboard.readText"],
  },
  {
    // Plant: the clipboard observer not wrapping `document.execCommand`.
    name: "clipboardCalls records document.execCommand copy, cut and paste, and no other command",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(host);
      await inPage(() => {
        // `execCommand` through a plain type: it is deprecated, and what a host may still call.
        const commands = document as unknown as { execCommand: (command: string) => boolean };
        commands.execCommand("copy");
        commands.execCommand("bold");
        commands.execCommand("cut");
        commands.execCommand("paste");
      }, null);
      return driver.clipboardCalls();
    },
    expected: ["document.execCommand copy", "document.execCommand cut", "document.execCommand paste"],
  },
  {
    // Plant: the clipboard observer not wrapping `DataTransfer.prototype.setData`.
    name: "clipboardCalls records a copy or cut event whose clipboardData is set, and not a DataTransfer of no clipboard event",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(host);
      await inPage(() => {
        document.addEventListener("copy", (event) => {
          event.clipboardData?.setData("text/plain", "secret");
          event.preventDefault();
        });
        document.addEventListener("cut", (event) => {
          event.clipboardData?.setData("text/plain", "secret");
        });
        document.body.dispatchEvent(new ClipboardEvent("copy", { clipboardData: new DataTransfer(), bubbles: true }));
        document.body.dispatchEvent(new ClipboardEvent("cut", { clipboardData: new DataTransfer(), bubbles: true }));
        new DataTransfer().setData("text/plain", "not a clipboard event");
      }, null);
      return driver.clipboardCalls();
    },
    expected: ["copy event setData", "cut event setData"],
  },
  {
    // Plant: `activationRecord` without the first frame (the `frame` entry is then missing).
    name: "activationRecord orders a deferred request after the activation's task and its first frame",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(host);
      await driver.rules(hostRules);
      await inPage(activationHost, "deferred");
      const record = await driver.activationRecord("f", watched);
      await driver.clickTarget("f");
      return record();
    },
    expected: [
      { entry: "activation", requests: 0, text: "Old", value: "Old" },
      { entry: "activation end", requests: 0, text: "", value: "" },
      { entry: "frame", requests: 0, text: "", value: "" },
      { entry: "request", requests: 0, text: "", value: "" },
    ],
  },
  {
    // Plant: `activationRecord` that records the request without its place (a request counted after the frame).
    name: "activationRecord puts a synchronous request inside the activation's task, before its end and the frame",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(host);
      await driver.rules(hostRules);
      await inPage(activationHost, "synchronous");
      const record = await driver.activationRecord("f", { request: "test-request" });
      await driver.clickTarget("f");
      return record();
    },
    expected: [
      { entry: "activation", requests: 0, text: null, value: null },
      { entry: "request", requests: 0, text: null, value: null },
      { entry: "activation end", requests: 1, text: null, value: null },
      { entry: "frame", requests: 1, text: null, value: null },
    ],
  },
  {
    // Plant: `axUpdates` dropping updates (only the last kept: the empty update is then missing).
    name: "axUpdates records the region emptied in one frame and filled in the next as two updates, empty first",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(region);
      const stop = await driver.axUpdates("w");
      await inPage(emptyThenFill, "frames");
      return stop();
    },
    expected: [
      { role: "status", live: "polite", text: "" },
      { role: "status", live: "polite", text: "Copied" },
    ],
  },
  {
    // The control of the one above: a region emptied and filled in one task is one update, already filled.
    name: "axUpdates records the region emptied and filled in one task as one update with the text",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(region);
      const stop = await driver.axUpdates("w");
      await inPage(emptyThenFill, "task");
      return stop();
    },
    expected: [{ role: "status", live: "polite", text: "Copied" }],
  },
];
