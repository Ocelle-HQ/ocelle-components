# Phase 1 fix 1

- A review probe found that an empty required textarea blocked connection-task submission, but Chromium could not focus the invalid field because its shadow textarea had not rendered. The new in-process and strict-CSP tests compare the same-task validation result to a native textarea. Both assertions failed before the fix, in a 17.749-second focused red run. The built test also requires a clean CSP and browser record.
- The invalid event now triggers the first Lit render synchronously if it has not happened. This supplies the native textarea to ElementInternals as the validation anchor before Chromium performs interactive focus. The test keeps its before-render assertion before requestSubmit. The successful same-task path still runs without an early render.
- The host failure test now verifies actual submitted FormData before rejection and after the reviewer corrects and resubmits, while keeping the existing focus, value and computed-description assertions.

The two browser projects passed all 17 tests in 6.38 seconds after the change.
