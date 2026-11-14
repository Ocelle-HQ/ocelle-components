// The selection model of the selection parents (014 FR-009 to FR-011a, FR-016; research.md R-03, R-05; data-model.md
// § Child entry, § Selection state, § Batching, § Transitions). Internal, not an entry point and not in the manifest.
// Pure functions over plain data (a child is its node, its value with FR-009's default applied and whether it is
// disabled), tested with no DOM in the in-process project Stryker runs (test/selection.test.ts), and `SelectionModel`,
// which holds one parent's state over a source of children:
// - the selection: the selected child and the remembered host value (FR-010a). The listbox may have no selection; tabs
//   and the segmented choice keep one while any child is enabled (FR-011a), a remembered value taking precedence in
//   every pick made without user action;
// - batches: the parent's `MutationObserver` delivers one batch of child records per microtask checkpoint (operator
//   decision PLAN-CORRECTNESS-1-014 (a)); a node present before and after a batch is kept, with its selection (a move);
//   the `value` setter first takes the pending records, so it decides on the live children;
// - the focus record (R-03): `focused` and `lastFocused` from `focusin`; `blurred` set only by a `focusout` with a null
//   `relatedTarget`, and kept as "had focus" only when the records that `focusout`'s microtask takes list it as removed
//   while focus is on the body or nowhere. So a removal or a move refocuses (or moves focus by FR-011), and a user who
//   leaves the parent by Tab or a click is never brought back by a later host move.

/** The parent kinds: the listbox may have no selection; tabs and segments keep one while any child is enabled. */
export type Kind = "listbox" | "tabs" | "segments";

/** One child of the parent: its node, its value (the default already applied) and whether it is disabled. */
export interface Entry<T> {
  readonly node: T;
  readonly value: string;
  readonly disabled: boolean;
}

/** The value of the child at `index` whose `value` attribute is `attribute`: as written, or the index when missing or blank (FR-009). */
export function childValue(attribute: string | null, index: number): string {
  return attribute === null || attribute.trim() === "" ? String(index) : attribute;
}

/** The selected child and the remembered host value (FR-010a). */
export interface Selection<T> {
  readonly selected: T | null;
  readonly remembered: string | null;
}

function entryOf<T>(entries: readonly Entry<T>[], node: T | null): Entry<T> | undefined {
  return entries.find((entry) => entry.node === node);
}

function firstEnabled<T>(entries: readonly Entry<T>[], value?: string): T | null {
  return entries.find((entry) => !entry.disabled && (value === undefined || entry.value === value))?.node ?? null;
}

/** The parent's value: the selected child's value, `""` when none. */
export function valueOf<T>(state: Selection<T>, entries: readonly Entry<T>[]): string {
  return entryOf(entries, state.selected)?.value ?? "";
}

/** Tabs and segments keep a selection while a child is enabled: with none, the first enabled child. */
function kept<T>(kind: Kind, selected: T | null, entries: readonly Entry<T>[]): T | null {
  return kind === "listbox" || selected !== null ? selected : firstEnabled(entries);
}

/**
 * A host set of `value` (FR-010, FR-010a): every set forgets a remembered value, and may be remembered in turn. No
 * child's value is ever empty (FR-009), so `""` matches none.
 */
export function hostSet<T>(kind: Kind, state: Selection<T>, entries: readonly Entry<T>[], value: string): Selection<T> {
  if (value === valueOf(state, entries)) return { selected: kept(kind, state.selected, entries), remembered: null };
  const match = firstEnabled(entries, value);
  if (match !== null) return { selected: match, remembered: null };
  const selected = kind === "listbox" ? null : kept(kind, state.selected, entries);
  return { selected, remembered: value === "" ? null : value };
}

/** A user selection of `node`; `changed` when the parent emits its change event. */
export function userSelect<T>(state: Selection<T>, entries: readonly Entry<T>[], node: T): { readonly state: Selection<T>; readonly changed: boolean } {
  const entry = entryOf(entries, node);
  if (entry === undefined || entry.disabled) return { state, changed: false };
  return { state: { selected: node, remembered: null }, changed: node !== state.selected };
}

/** The node of the first entry of `list` that `present` finds among the children, enabled; null when none. */
function firstUsable<T>(list: readonly Entry<T>[], present: (entry: Entry<T>) => Entry<T> | undefined): T | null {
  for (const entry of list) {
    const found = present(entry);
    if (found !== undefined && !found.disabled) return found.node;
  }
  return null;
}

/**
 * The child FR-011 moves focus to (and FR-011a selection to) when `node` is removed or disabled: the next enabled child
 * after it in document order, else the nearest enabled child before it; null when there is none or `node` was never a
 * child. A node still present is placed by the children after the batch, a removed one by the children before it.
 */
export function fallback<T>(before: readonly Entry<T>[], after: readonly Entry<T>[], node: T | null): T | null {
  const inAfter = after.findIndex((entry) => entry.node === node);
  if (inAfter !== -1) {
    const same = (entry: Entry<T>): Entry<T> => entry;
    return firstUsable(after.slice(inAfter + 1), same) ?? firstUsable(after.slice(0, inAfter).reverse(), same);
  }
  const inBefore = before.findIndex((entry) => entry.node === node);
  if (inBefore === -1) return null;
  const present = (entry: Entry<T>): Entry<T> | undefined => entryOf(after, entry.node);
  return firstUsable(before.slice(inBefore + 1), present) ?? firstUsable(before.slice(0, inBefore).reverse(), present);
}

/** The outcome of a batch: the selection, and the child to focus (null leaves focus alone). */
export interface BatchResult<T> {
  readonly state: Selection<T>;
  readonly focus: T | null;
}

/** The selection after a batch (data-model.md § Transitions). */
function selectionAfter<T>(kind: Kind, state: Selection<T>, before: readonly Entry<T>[], after: readonly Entry<T>[]): Selection<T> {
  const remembered = state.remembered === null ? null : firstEnabled(after, state.remembered);
  if (remembered !== null) return { selected: remembered, remembered: null };
  const current = entryOf(after, state.selected);
  if (kind === "listbox") return { selected: current === undefined ? null : state.selected, remembered: state.remembered };
  if (current !== undefined && !current.disabled) return state;
  return { selected: fallback(before, after, state.selected) ?? firstEnabled(after), remembered: state.remembered };
}

/**
 * One batch of child changes; `hadFocus` is the child that had focus at the batch. A child that had focus and is
 * still a child keeps it, except a selected tab or segment whose selection moved, which takes focus with it; a removed
 * one gives focus to the new selection when it was the selected tab or segment, else to FR-011's fallback.
 */
export function batch<T>(kind: Kind, state: Selection<T>, before: readonly Entry<T>[], after: readonly Entry<T>[], hadFocus: T | null): BatchResult<T> {
  const next = selectionAfter(kind, state, before, after);
  if (hadFocus === null) return { state: next, focus: null };
  const followsSelection = kind !== "listbox" && hadFocus === state.selected;
  if (followsSelection && next.selected !== null) return { state: next, focus: next.selected };
  if (entryOf(after, hadFocus) !== undefined) return { state: next, focus: hadFocus };
  return { state: next, focus: followsSelection ? null : fallback(before, after, hadFocus) };
}

/** The tab stop (FR-016): the selected child if enabled, else the last focused enabled child, else the first enabled. */
export function tabStop<T>(state: Selection<T>, entries: readonly Entry<T>[], lastFocused: T | null): T | null {
  for (const node of [state.selected, lastFocused]) {
    const entry = entryOf(entries, node);
    if (entry !== undefined && !entry.disabled) return entry.node;
  }
  return firstEnabled(entries);
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
export function focusIn<T>(_record: FocusRecord<T>, node: T): FocusRecord<T> {
  return { focused: node, blurred: null, lastFocused: node };
}

/** A `focusout` from the child `node`, with the event's `relatedTarget`: only a null one sets `blurred`. */
export function focusOut<T>(record: FocusRecord<T>, node: T, relatedTarget: unknown): FocusRecord<T> {
  return { focused: null, blurred: relatedTarget === null ? node : null, lastFocused: record.lastFocused };
}

/**
 * The `focusout` microtask: `removed` are the nodes the taken records removed, `focusLeft` whether
 * `document.activeElement` is the body or null. `hadFocus` is the blurred child when the removal caused its blur; the
 * record's `blurred` is cleared either way.
 */
export function takeBlurred<T>(record: FocusRecord<T>, removed: readonly T[], focusLeft: boolean): { readonly record: FocusRecord<T>; readonly hadFocus: T | null } {
  const { blurred } = record;
  const hadFocus = blurred !== null && focusLeft && removed.includes(blurred) ? blurred : null;
  return { record: { ...record, blurred: null }, hadFocus };
}

/** Where a model reads its children: the live children, and the pending child records (one list of removed nodes each). */
export interface Source<T> {
  readonly read: () => readonly Entry<T>[];
  readonly take: () => readonly (readonly T[])[];
}

/** A parent's selection state, focus record and batching over a source of children. */
export class SelectionModel<T> {
  readonly #kind: Kind;
  readonly #source: Source<T>;
  #entries: readonly Entry<T>[] = [];
  #state: Selection<T> = { selected: null, remembered: null };
  #record: FocusRecord<T> = noFocus;

  constructor(kind: Kind, source: Source<T>) {
    this.#kind = kind;
    this.#source = source;
  }

  get entries(): readonly Entry<T>[] {
    return this.#entries;
  }

  get selected(): T | null {
    return this.#state.selected;
  }

  get remembered(): string | null {
    return this.#state.remembered;
  }

  get value(): string {
    return valueOf(this.#state, this.#entries);
  }

  get record(): FocusRecord<T> {
    return this.#record;
  }

  /** The tab stop now (FR-016). */
  tabStop(): T | null {
    return tabStop(this.#state, this.#entries, this.#record.lastFocused);
  }

  /**
   * A host set of `value`, after the pending records are taken and processed as a batch. The taken records feed the
   * focus record as the `focusout` microtask's would (`focusLeft` as there), since that microtask then finds none: a
   * focused child removed or moved in the task of the set gives the child to focus, which is returned (review round 1,
   * R1-01).
   */
  set(value: string, focusLeft = false): T | null {
    const { record, hadFocus } = takeBlurred(this.#record, this.#source.take().flat(), focusLeft);
    this.#record = record;
    const focus = this.#process(hadFocus ?? record.focused);
    this.#state = hostSet(this.#kind, this.#state, this.#entries, value);
    return focus;
  }

  /** A user selection; true when the parent emits its change event. */
  select(node: T): boolean {
    const { state, changed } = userSelect(this.#state, this.#entries, node);
    this.#state = state;
    return changed;
  }

  /** The observer's batch; returns the child to focus, or null. */
  batch(): T | null {
    return this.#process(this.#record.focused);
  }

  focusIn(node: T): void {
    this.#record = focusIn(this.#record, node);
  }

  /** A `focusout` from a child; true when the record set `blurred` and the caller queues `afterBlur`. */
  focusOut(node: T, relatedTarget: unknown): boolean {
    this.#record = focusOut(this.#record, node, relatedTarget);
    return this.#record.blurred !== null;
  }

  /** The `focusout` microtask; returns the child to focus, or null. */
  afterBlur(focusLeft: boolean): T | null {
    const records = this.#source.take();
    const { record, hadFocus } = takeBlurred(this.#record, records.flat(), focusLeft);
    this.#record = record;
    if (records.length === 0) return null;
    return this.#process(hadFocus);
  }

  #process(hadFocus: T | null): T | null {
    const after = this.#source.read();
    const { state, focus } = batch(this.#kind, this.#state, this.#entries, after, hadFocus);
    this.#entries = after;
    this.#state = state;
    return focus;
  }
}
