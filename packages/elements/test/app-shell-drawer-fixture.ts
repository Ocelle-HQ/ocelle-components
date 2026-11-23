import { expect } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-app-shell.ts";
import { deepActive } from "../src/focusable.ts";
import { inProcessDriver } from "./in-process.ts";

export const driver = inProcessDriver();
export const rail = '<nav slot="rail" aria-label="Konto"><a id="account" href="#account">Konto</a></nav>';
export const sidebar = '<a slot="sidebar" href="#work" id="work">Arbeitsbereich</a><a slot="sidebar" href="#files" id="files">Dateien</a>';

export function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected an element in the app shell fixture");
  return value;
}

export async function mount(layout: string, navigation: string, width = 700): Promise<HTMLElementTagNameMap["ocelle-app-shell"]> {
  await driver.mount(`<div id="frame" style="inline-size: ${String(width)}px"><ocelle-app-shell id="shell" layout="${layout}" product-name="Projektverwaltung mit Lokalisierung" sidebar-label="Projekte" drawer-label="Bereiche" close-label="Bereiche schließen" menu-label="Bereiche öffnen">${navigation}<button slot="actions">Aktionen</button><button id="content">Inhalt</button></ocelle-app-shell></div>`);
  return required(document.querySelector("ocelle-app-shell"));
}

export function resize(width: number): void {
  required(document.getElementById("frame")).style.inlineSize = `${String(width)}px`;
}

export function menu(shell: HTMLElementTagNameMap["ocelle-app-shell"]): HTMLButtonElement | null | undefined {
  return shell.shadowRoot?.querySelector("ocelle-top-bar")?.shadowRoot?.querySelector("button");
}

export function panel(shell: HTMLElementTagNameMap["ocelle-app-shell"]): HTMLDialogElement | null | undefined {
  return shell.shadowRoot?.querySelector("ocelle-drawer")?.shadowRoot?.querySelector("dialog");
}

export function close(shell: HTMLElementTagNameMap["ocelle-app-shell"]): HTMLButtonElement {
  return required(panel(shell)?.querySelector<HTMLButtonElement>('[part="close-button"]'));
}

export async function click(element: Element): Promise<void> {
  const rect = element.getBoundingClientRect();
  await driver.pointer([{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, down: true, up: true }]);
}

export async function open(shell: HTMLElementTagNameMap["ocelle-app-shell"], input = "Enter"): Promise<void> {
  await expect.poll(() => menu(shell)?.isConnected).toBe(true);
  const trigger = required(menu(shell));
  if (input === "pointer") await click(trigger);
  else {
    trigger.focus();
    await commands.press(input);
  }
  await expect.poll(() => panel(shell)?.matches(":modal")).toBe(true);
}

export async function focused(target: Element | null | undefined): Promise<void> {
  await expect.poll(deepActive).toBe(target);
}
