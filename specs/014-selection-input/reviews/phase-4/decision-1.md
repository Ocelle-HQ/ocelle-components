# Plan decision 1: the engine floor (T059a)

Recorded by the orchestrator, 2026-11-15, human:jeroennouwsdev.

**Answer: yes.** The operator confirms that kitty-mission-ui supports WebKit 17.4 and Chromium 125 or later. The
joined segmented choice uses CSS custom states (`:state()`) for its row boundaries, and the engine floor is raised from
Chromium 120 / WebKit 16.4 to Chromium 125 / WebKit 17.4. T064, T066 and T067 apply as written; T062a, T064a, T066a and
T067a are skipped. Asked as a multiple-choice question at the T059a stop; the options were "no, keep the floor",
"yes, raise the floor" and "wait for the answer".
