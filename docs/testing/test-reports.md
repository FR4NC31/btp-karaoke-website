# BTP Karaoke — QA Test Reports

How to record and read Playwright QA results. Statuses are always
**PASS / FAIL / BLOCKED** ([definitions](qa-strategy.md#pass--fail--blocked)).
Every FAIL needs Expected vs Actual — never just "Test failed".

## Reading an automated run

```bash
cd frontend
npm run test:e2e           # full suite
npm run test:e2e:report    # HTML report of the last run
```

- Console output lists each case ID with its severity tag.
- On failure the report attaches `console-and-network.txt`, screenshot,
  video and a trace (`trace.zip` → `npx playwright show-trace <file>`).
- CI uploads the same report as an artifact when the workflow fails.

## Report format

### PASS

```text
Test:
KARAOKE-002

Environment:
Local test (Vite :5173 + Hono :3000)

Expected:
Selecting the Rock genre shows only the matching collection and
"All Genres" restores all six.

Actual:
"Viewing 1 of 6 sets" shown while Rock was active; all six
collections returned after clicking "All Genres".

Result:
PASS
```

### FAIL

```text
Test Case:
PLAYER-004

Status:
FAIL

Environment:
Test

Expected:
Clicking the player toggle cycles Play → Pause → Play.

Actual:
After the second click the control stayed on "Pause"; the third
click had no effect. Reproduced 3/3 times.

Impact:
Users cannot resume playback — a major player workflow breaks.

Severity:
P1 — High

Evidence:
- Screenshot (test-results/…/test-failed-1.png)
- Playwright trace (test-results/…/trace.zip)
- console-and-network.txt attachment (no console errors, no failed requests)
- Video (test-results/…/video.webm)

Recommendation:
Inspect the player toggle state handling in the Studio component.

Ticket Required:
YES → see bug-reporting.md before filing
```

### BLOCKED

```text
Test:
SMOKE-006

Status:
BLOCKED

Reason:
Backend dev server did not start — port 3000 occupied by another
process, health endpoint unreachable.

Classification:
Environment issue (not a product bug)

Action:
Free the port / restart the environment, then re-run the suite with
`npx playwright test` (`--last-failed` cannot rerun tests that were
blocked before execution).
```

## Latest automated runs

| Date       | Suite       | Result                     | Notes                                  |
| ---------- | ----------- | -------------------------- | -------------------------------------- |
| 2026-10-08 | Full (35)   | **PASS — 35/35**           | Evidence pipeline verified separately  |
| 2026-10-08 | Smoke (6)   | **PASS — 6/6**             | ~18 s                                  |
| 2026-10-08 | Lint/TS/Build (frontend), TS (backend) | **PASS** | —                        |

Update this table whenever a run is triaged.

## Investigating a failure

1. Open the HTML report (`npm run test:e2e:report`).
2. Read `console-and-network.txt` — app error? network error? test issue?
3. Open the trace to see exactly what the user "saw".
4. Re-run locally: `npx playwright test -g "<CASE-ID>" --headed --debug`.
5. Classify: product bug → [bug-reporting.md](bug-reporting.md);
   test/environment problem → fix the test or environment (no ticket).
