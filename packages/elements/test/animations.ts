// The animation reader of the shared scenario bodies (013 phase 3; contracts/checks.md § Driver additions; tasks.md
// T037), used by both drivers: the in-process driver calls it, the fixture driver passes it to `page.evaluate`, so it is
// self-contained (no import, no outer name). It lists the current animations and transitions (`getAnimations()`,
// which leaves out a finished animation that fills nothing) of the element with `id` and of every element of its
// shadow root, in tree order. 018 phase 1 adds `animationStatesOf` (with a stable identity and the iteration count) and
// `seekOf`, self-contained in the same way.
import type { AnimationState, Running } from "./scenarios/driver.ts";

/** The current animations and transitions on the element with `id` and in its shadow root. */
export function runningOf(id: string): Running[] {
  const host = document.getElementById(id);
  if (host === null) throw new Error(`no #${id} on the page`);
  const targets: Element[] = [host, ...(host.shadowRoot?.querySelectorAll("*") ?? [])];
  return targets.flatMap((target) =>
    target.getAnimations().map((animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      const kind = animation.constructor.name;
      const property =
        "transitionProperty" in animation
          ? (animation as unknown as { transitionProperty: string }).transitionProperty
          : [...new Set((effect?.getKeyframes() ?? []).flatMap((frame) => Object.keys(frame).filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key))))].join(",");
      const endTime = Number(effect?.getComputedTiming().endTime ?? 0);
      const current = animation.currentTime;
      return {
        kind,
        part: target === host ? "host" : (target.getAttribute("part") ?? target.localName),
        property,
        playState: animation.playState,
        endTime,
        currentTime: current === null ? null : Number(current),
      };
    }),
  );
}

/**
 * The current animations and transitions on the element with `id` and in its shadow root, as `runningOf` lists them,
 * each with a stable identity and its iteration count (018 research.md R-11; contracts/checks.md § Test harness row 1).
 * Self-contained like `runningOf`. The page keeps one record under `Symbol.for("ocelle.test.animationIdentity")`: a
 * `WeakMap` from each `Animation` object read to its number, given in reading order from 1, so the same object reads
 * the same number and a new object a new one, until the page is left.
 */
export function animationStatesOf(id: string): AnimationState[] {
  const host = document.getElementById(id);
  if (host === null) throw new Error(`no #${id} on the page`);
  interface Identities {
    readonly known: WeakMap<Animation, number>;
    next: number;
  }
  const store = globalThis as unknown as Record<symbol, Identities | undefined>;
  const key = Symbol.for("ocelle.test.animationIdentity");
  const identities = store[key] ?? { known: new WeakMap<Animation, number>(), next: 1 };
  store[key] = identities;
  const targets: Element[] = [host, ...(host.shadowRoot?.querySelectorAll("*") ?? [])];
  return targets.flatMap((target) =>
    target.getAnimations().map((animation) => {
      let identity = identities.known.get(animation);
      if (identity === undefined) {
        identity = identities.next;
        identities.next += 1;
        identities.known.set(animation, identity);
      }
      const effect = animation.effect as KeyframeEffect | null;
      const timing = effect?.getComputedTiming();
      const property =
        "transitionProperty" in animation
          ? (animation as unknown as { transitionProperty: string }).transitionProperty
          : [...new Set((effect?.getKeyframes() ?? []).flatMap((frame) => Object.keys(frame).filter((name) => !["offset", "computedOffset", "easing", "composite"].includes(name))))].join(",");
      const iterations = timing?.iterations ?? 1;
      const current = animation.currentTime;
      return {
        identity,
        kind: animation.constructor.name,
        part: target === host ? "host" : (target.getAttribute("part") ?? target.localName),
        property,
        playState: animation.playState,
        iterations: Number.isFinite(iterations) ? iterations : "infinite",
        endTime: Number(timing?.endTime ?? 0),
        currentTime: current === null ? null : Number(current),
      };
    }),
  );
}

/**
 * Pauses every animation of the element matching `inner` in the shadow root of the element with `id` (of the element
 * itself when `inner` is null), not of its subtree, and sets its current time to `ms` (018 research.md R-11;
 * contracts/checks.md § Test harness row 2). Self-contained like `runningOf`. Throws when the element has none, so a
 * seek never passes silently.
 */
export function seekOf({ id, inner, ms }: { readonly id: string; readonly inner: string | null; readonly ms: number }): void {
  const host = document.getElementById(id);
  if (host === null) throw new Error(`no #${id} on the page`);
  const target = inner === null ? host : (host.shadowRoot?.querySelector(inner) ?? null);
  if (target === null) throw new Error(`seek: no ${String(inner)} in the shadow root of #${id}`);
  const animations = target.getAnimations();
  if (animations.length === 0) throw new Error(`seek: no animation on ${inner ?? `#${id}`}`);
  for (const animation of animations) {
    animation.pause();
    animation.currentTime = ms;
  }
}
