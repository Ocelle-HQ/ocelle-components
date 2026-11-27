# Hosted scoped capture control

On #107, run 45900285064 attempt 1 completed the single capture job in 105 seconds. It tested head `ce646794f2c35c836d190ff8897282621e899255` with base `1d599fd4f5be62f4f1257cd6dab4a764c3e3b785` and tested merge `0234e6c682e791fc33ef544959c5faa6a2653b79`.

The requested story was `elements-ocelle-button--grounds`. The pinned Docker and Podman captures agreed and the existing baselines needed no changes. The uploaded ZIP's SHA-256 was `f9288ee40bd97d0495e83674043a351365e5761fb7f26bcd3bb9cf175d55e215`. The independent review and integration checks verified the downloaded archive against that digest. The archive contains exactly the receipt and the selected light and dark PNGs. Both file digests match the receipt and both PNGs match the tracked baselines byte for byte.

[Capture run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900285064) · [Verified artifact](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900285064/artifacts/15155726118)

## Hosted Visual runtime observation

The full Visual job on the same source head matched all 796 baselines across Docker and Podman. Both auditable recorder steps passed and the `pin-record` archive matched GitHub's digest. Its schema 2 record matched the exact post-step log digest and identified pnpm 12.16.1 behind the audited wrapper. The measured native executable SHA-256 `41fe8049fc73f4239b99487c35def4eacdb3cb18659a6003573500e3cc313628` equals the pinned release executable's digest.

The exact attempt ZIP contained one complete Visual regression job log. The tested merge, capture result and executed-tool digest matched the direct job evidence. This proves archive extraction and hosted attestation on the tooling candidate. The complete same-PR, evidence-only eligibility comparison belongs to #86.

[Full Visual job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900267968/job/140184053364) · [Runtime archive](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45900267968/artifacts/15155532998)
