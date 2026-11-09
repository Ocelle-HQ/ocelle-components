// A planted failure: the overrides module throws while loading, so the token source that imports it throws.
throw new Error("planted: the token source throws while loading");

export const overrides = [];
