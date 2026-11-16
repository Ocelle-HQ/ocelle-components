// The animation reader of the shared scenario bodies (013 phase 3; contracts/checks.md § Driver additions; tasks.md
// T037), used by both drivers: the in-process driver calls it, the fixture driver passes it to `page.evaluate`, so it is
// self-contained (no import, no outer name). It lists the current animations and transitions (`getAnimations()`,
// which leaves out a finished animation that fills nothing) of the element with `id` and of every element of its
// shadow root, in tree order.
import type { Running } from "./scenarios/driver.ts";

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
