import type { Browser } from "playwright";
import { afterAll, beforeAll, expect, inject, it } from "vitest";
import { submitInConnectionTask } from "../scenarios/form-textarea.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

const built = inject("elementsFixture");
let served: Served;
let browser: Browser;

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser.close();
  await served.close();
});

it("submits the built textarea under strict CSP before render with native LF data", async () => {
  const { page, finish } = await visit(browser, served.origin, "form-textarea.html");
  const expected = await page.evaluate(submitInConnectionTask, { native: true, setup: "markup" as const });
  const result = await page.evaluate(submitInConnectionTask, { native: false, setup: "markup" as const });
  const recorded = await finish();
  expect(result).toEqual(expected);
  expect(result.submissions).toEqual([[["answer", "first\nsecond\nthird\nfourth"]]]);
  expect(recorded).toEqual(clean);
});

it("uses native CRLF on the wire and preserves the strict CSP", async () => {
  const { page, finish } = await visit(browser, served.origin, "form-textarea.html", ["ocelle-elements.js", "submit"]);
  const submitted = page.waitForResponse("**/submit");
  await page.evaluate(() => {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/submit";
    form.innerHTML = '<ocelle-form-textarea name="answer" value="first&#13;&#10;second&#13;third"></ocelle-form-textarea>';
    document.body.append(form);
    form.requestSubmit();
  });
  await submitted;
  const recorded = await finish();
  expect(new URLSearchParams(served.submissions().at(-1)).get("answer")).toBe("first\r\nsecond\r\nthird");
  expect(recorded).toEqual(clean);
});

it("wraps and edits answers in a narrow built dialog without submitting on Enter", async () => {
  const { page, finish } = await visit(browser, served.origin, "form-textarea.html");
  await page.setViewportSize({ width: 320, height: 540 });
  await page.locator("main").evaluate((main) => {
    main.innerHTML = '<ocelle-dialog open label="Review"><form><ocelle-form-textarea label="Decision" name="answer"></ocelle-form-textarea><button type="submit">Save</button></form></ocelle-dialog>';
    const form = main.querySelector("form");
    if (form === null) throw new Error("missing dialog form fixture");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.setAttribute("data-submitted", "true");
    });
  });
  const editor = page.locator("ocelle-form-textarea textarea");
  expect(await editor.count(), "the built dialog contains the native textarea").toBe(1);
  await editor.focus();
  await page.keyboard.insertText("Write the decision and the conditions for publishing it. ".repeat(3));
  await page.keyboard.press("Enter");
  await page.keyboard.insertText("Confirm the rollout window.");
  const shown = await editor.evaluate((field) => ({
    focused: field.matches(":focus"),
    verticallyWrapped: field.scrollHeight > field.clientHeight,
    horizontallyWrapped: field.scrollWidth <= field.clientWidth,
  }));
  const value = await editor.inputValue();
  const submitted = await page.locator("form").getAttribute("data-submitted");
  const recorded = await finish();
  expect(shown).toEqual({
    focused: true,
    verticallyWrapped: true,
    horizontallyWrapped: true,
  });
  expect(value).toBe(`${"Write the decision and the conditions for publishing it. ".repeat(3)}\nConfirm the rollout window.`);
  expect(submitted).toBeNull();
  expect(recorded).toEqual(clean);
});
