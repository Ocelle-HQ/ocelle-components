import config from "./stryker.elements.config.json" with { type: "json" };

// Only the opt-in related-element comparison uses this configuration.
export default { ...config, vitest: { ...config.vitest, related: true } };
