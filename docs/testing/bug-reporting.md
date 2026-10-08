# BTP Karaoke — QA Bug Reporting Workflow

How to turn a Playwright failure into a fix — and how to avoid filing noise.

## Triage flow

```text
Playwright failure
        ↓
Investigation (report + trace + repro locally)
        ↓
Application bug?
      /   \
    YES    NO
     ↓      ↓
 GitHub   Fix the test /
 Issue    the environment
```

**Do not automatically create a GitHub Issue for every failed test.**

A failure becomes a ticket only when **all** of these hold:

1. It reproduces locally (`npx playwright test -g "<CASE-ID>"`).
2. The trace shows the application behaving incorrectly (not the test
   mis-locating, waiting wrongly, or assuming unimplemented behavior).
3. It is not an environment problem (server down, port busy, missing deps)
   → those are **BLOCKED**, not FAIL.
4. Expected vs Actual can be written clearly.

## GitHub issue format

Title pattern: `[BUG][AREA] short description`

```text
Title:
[BUG][PLAYER] Player cannot resume after pause

Priority:
P1 — High

Environment:
Test (local Vite :5173 + Hono :3000, Chromium)

Test Case:
PLAYER-004 (docs/testing/test-cases.md)

Expected:
Clicking the player control cycles Play → Pause → Play.

Actual:
After pausing, the control stays on "Pause"; further clicks do
not resume playback. Reproduced 3/3 runs.

Impact:
Users cannot resume karaoke playback — major player workflow.

Steps to Reproduce:
1. Open BTP Karaoke (`/studio`).
2. Click Play in the player bar.
3. Click Pause.
4. Click the control again.

Evidence:
- Playwright screenshot: test-results/…/test-failed-1.png
- Playwright trace: test-results/…/trace.zip
- HTML report attachment: console-and-network.txt (no console/network errors)

Suspected Area:
Player state handling in the Studio page component.

Acceptance Criteria:
The player control toggles reliably between Play and Pause,
including after pause, and the E2E case PLAYER-004 passes.
```

## Severity & priority

Use P0–P3 from [qa-strategy.md](qa-strategy.md#severity-definitions).
Priority in the ticket = user impact, not developer effort.

## Rules

- One defect → one issue. Group duplicates instead of filing each run.
- Attach evidence; never paste secrets or production data (there should
  never be any).
- Tag areas consistently: `[AUTH]`, `[KARAOKE]`, `[PLAYER]`, `[NAV]`,
  `[ERRORS]`, `[SMOKE]`, `[BACKEND]`, `[CI]`.
- After the fix, the same case must pass — the failure becomes a regression
  test automatically (it already exists in the suite).
- Environment/test issues: fix the test or environment, no ticket; mention
  it in the run notes in [test-reports.md](test-reports.md).
