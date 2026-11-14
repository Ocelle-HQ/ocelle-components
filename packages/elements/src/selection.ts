// The selection model of the selection parents (014 research.md R-03, R-05; data-model.md). Internal, not an entry
// point and not in the manifest. Scaffold: signatures only.

/** The parent kinds: the listbox may have no selection; tabs and segments keep one while any child is enabled. */
export type Kind = "listbox" | "tabs" | "segments";

/** One child of the parent: its node, its value (the default already applied) and whether it is disabled. */
export interface Entry<T> {
  readonly node: T;
  readonly value: string;
  readonly disabled: boolean;
}

/** The value of the child at `index` whose `value` attribute is `attribute` (FR-009). */
export function childValue(_attribute: string | null, _index: number): string {
  return "";
}

/** The selected child and the remembered host value (FR-010a). */
export interface Selection<T> {
  readonly selected: T | null;
  readonly remembered: string | null;
}

/** The parent's value: the selected child's value, `""` when none. */
export function valueOf<T>(_state: Selection<T>, _entries: readonly Entry<T>[]): string {
  return "";
}

/** A host set of `value` (FR-010, FR-010a). */
export function hostSet<T>(_kind: Kind, state: Selection<T>, _entries: readonly Entry<T>[], _value: string): Selection<T> {
  return state;
}

/** A user selection of `node`; `changed` when the parent emits its change event. */
export function userSelect<T>(state: Selection<T>, _entries: readonly Entry<T>[], _node: T): { readonly state: Selection<T>; readonly changed: boolean } {
  return { state, changed: false };
}

/** The child FR-011 moves focus to (and FR-011a selection to) when `node` is removed or disabled, or null. */
export function fallback<T>(_before: readonly Entry<T>[], _after: readonly Entry<T>[], _node: T): T | null {
  return null;
}

/** The outcome of a batch: the selection, and the child to focus (null leaves focus alone). */
export interface BatchResult<T> {
  readonly state: Selection<T>;
  readonly focus: T | null;
}

/** One batch of child changes (data-model.md § Transitions); `hadFocus` is the child that had focus at the batch. */
export function batch<T>(_kind: Kind, state: Selection<T>, _before: readonly Entry<T>[], _after: readonly Entry<T>[], _hadFocus: T | null): BatchResult<T> {
  return { state, focus: null };
}

/** The tab stop (FR-016): the selected child if enabled, else the last focused enabled child, else the first enabled. */
export function tabStop<T>(_state: Selection<T>, _entries: readonly Entry<T>[], _lastFocused: T | null): T | null {
  return null;
}

/** The focus record (research.md R-03). */
export interface FocusRecord<T> {
  readonly focused: T | null;
  readonly blurred: T | null;
  readonly lastFocused: T | null;
}

/** The record before any focus. */
export const noFocus: FocusRecord<never> = { focused: null, blurred: null, lastFocused: null };

/** A `focusin` on the child `node`. */
export function focusIn<T>(record: FocusRecord<T>, _node: T): FocusRecord<T> {
  return record;
}

/** A `focusout` from the child `node`, with the event's `relatedTarget`. */
export function focusOut<T>(record: FocusRecord<T>, _node: T, _relatedTarget: unknown): FocusRecord<T> {
  return record;
}

/**
 * The `focusout` microtask: `removed` are the nodes the taken records removed, `focusLeft` whether
 * `document.activeElement` is the body or null. `hadFocus` is the blurred child when the removal caused its blur.
 */
export function takeBlurred<T>(record: FocusRecord<T>, _removed: readonly T[], _focusLeft: boolean): { readonly record: FocusRecord<T>; readonly hadFocus: T | null } {
  return { record, hadFocus: null };
}

/** Where a model reads its children: the live children, and the pending child records (one list of removed nodes each). */
export interface Source<T> {
  readonly read: () => readonly Entry<T>[];
  readonly take: () => readonly (readonly T[])[];
}

/** A parent's selection state, focus record and batching over a source of children. */
export class SelectionModel<T> {
  constructor(_kind: Kind, _source: Source<T>) {}

  get entries(): readonly Entry<T>[] {
    return [];
  }

  get selected(): T | null {
    return null;
  }

  get remembered(): string | null {
    return null;
  }

  get value(): string {
    return "";
  }

  get record(): FocusRecord<T> {
    return noFocus;
  }

  /** The tab stop now (FR-016). */
  tabStop(): T | null {
    return null;
  }

  /** A host set of `value`, after the pending records are taken and processed as a batch. */
  set(_value: string): void {}

  /** A user selection; true when the parent emits its change event. */
  select(_node: T): boolean {
    return false;
  }

  /** The observer's batch; returns the child to focus, or null. */
  batch(): T | null {
    return null;
  }

  focusIn(_node: T): void {}

  /** A `focusout` from a child; true when the record set `blurred` and the caller queues `afterBlur`. */
  focusOut(_node: T, _relatedTarget: unknown): boolean {
    return false;
  }

  /** The `focusout` microtask; returns the child to focus, or null. */
  afterBlur(_focusLeft: boolean): T | null {
    return null;
  }
}
