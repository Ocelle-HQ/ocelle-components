# Changed-source mutation

- Candidate: `027571375536b7c76a6a578c2109eeb96b77305e`
- Base: `b8f06d5c652aae2c308d0a09f3e991e800138004`
- Command: `pnpm run gate:mutation -- --base b8f06d5c652aae2c308d0a09f3e991e800138004 --files gates/bin/story-evidence.ts,gates/lib/test-evidence.ts,gates/bin/test-shards.ts`
- Result: 168 mutants on changed lines across three files, zero survivors and zero timeouts. The gate reported 38 compile errors and one existing documented process-boundary record.

The first run exposed gaps around mixed red ancestry, omission of metadata without an upstream pin, and runner diagnostics. Added focused assertions for each condition before rerunning the affected gate.
