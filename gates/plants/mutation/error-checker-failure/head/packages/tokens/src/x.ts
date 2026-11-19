// Plant for mutation testing: sample package source. The field `#region` has no type annotation and its initializer
// passes `this` to a constructor with a callback, and the sample adds itself to the global HTMLElementTagNameMap: tsc
// accepts the file, but Stryker's type checker, rechecking the program after any change to it, reports a circular
// inference on the field's lines (TS7022, TS7023), as it did for ocelle-data-table.ts (019 T025, gate gap rule (c)).
interface Options {
  readonly first: () => Element | null;
}

class Region {
  readonly #options: Options;
  constructor(host: object, options: Options) {
    this.#options = options;
    void host;
  }
  first(): Element | null {
    return this.#options.first();
  }
}

export class Sample {
  readonly #region = new Region(this, {
    first: () => this.#rows()?.querySelector(":scope > thead") ?? null,
  });

  #rows(): Element | undefined {
    return undefined;
  }

  first(): Element | null {
    return this.#region.first();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "x-sample": Sample;
  }
}

export function label(sample: Sample): string {
  return sample.first() === null ? "none" : "first";
}
