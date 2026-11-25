# Phase 4 operator round 2 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| O2-01 / L1-01 | fixed | Signed `2c89a4f6` reproduces five in-process and two built strict-CSP failures with trusted Step activation. [Recorded red](red-fix-2.log) | [Shared reveal admission and continuation](../../../../packages/elements/src/ocelle-workflow-canvas.ts) · [Native browser coverage](../../../../packages/elements/test/workflow-canvas.test.ts) · [Built strict-CSP coverage](../../../../packages/elements/test/browser/workflow-canvas.test.ts) |

`red.sh 4 fix-2` recorded seven named assertion failures in 89.091 s. The test verifies that the trusted click reaches the button before the native focus callback invokes the host changes. At the reviewed revision a removed step or position and externally redirected focus each caused an extra request. A partly accepted viewport produced a proposal calculated from the previous bounds. A fully revealing viewport still produced an extra request. The unchanged trusted activation passed the one-request control.

Step and Follow now share live admission against the current graph and rendered placement. Trusted Step activation checks whether its initiating control still owns focus after the host listener runs. A removed or unpositioned named target abandons the pending action and returns owned focus to the visible Step picker. An external focus redirect leaves focus with the host. A host-supplied viewport renders before the component measures the target. If the rendered target is exposed it receives focus, and if it is clipped the current geometry produces one request. The focused initiator stays visible while that proposal is withheld.

The established scripted Step can still request a viewport from a clipped or inert canvas with unchanged host scroll. A request that never acquired initiating focus carries no focus handoff. Existing relationship-specific Follow admission, host requests and focus tests remain in scope.

## Local checks

The six Canvas suites passed all 364 tests, including the built aggregate and real Chromium touch. Test lint checked 524 files, Code lint checked 692, and typecheck passed. The local affected run matched the 16 non-container verdicts. [Affected Plants](plants.md#operator-round-2)

The first strict retarget exposed three observable ownership gaps in the tests. Direct Chromium runs applied the exact prior replacements to the reported source one at a time. A host capture listener intercepts the native blur before the initiating control handles it, then removes the pending placement or accepts the viewport. Both cases retain external host focus. A separate inert Reveal can still request a viewport while the visible picker keeps focus inside the same shadow root, with no handoff when Reveal later gains focus. The unchanged product passed all three controls and each exact replacement failed its named assertion. The fourth survivor tested a redundant branch on a Follow row with no Step picker. Recovery now resolves the initiating control's actual navigator before trying to focus a named control.
