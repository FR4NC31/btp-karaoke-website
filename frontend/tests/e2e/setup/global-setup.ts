import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Runs once before every Playwright run: reset the shared E2E account's
 * booking residue so the suite starts clean (backend/scripts/reset-e2e-state.ts).
 *
 * Two failure modes it prevents, both of which start as green-run surprises:
 *
 *  - Suspension: expired payment holds call `recordPaymentFailure`, which
 *    suspends `qa@example.com` (10/30/60/120/240-minute penalties). The
 *    suspension check runs before booking validation, so a stale suspension
 *    answers every later `POST /api/bookings` with 403 — ten booking/admin
 *    tests fail with no other symptom.
 *  - Burnt days: a test that dies after creating its booking leaves a live
 *    row on the far-future pool; the partial unique indexes then 409 the
 *    next attempt ("already has a live booking for this service on that
 *    day"), which is how ADMIN-005 lost a dozen FILSCAP days.
 *
 * Failures that accumulate *during* a run are accepted residual risk — the
 * reset only guarantees a clean starting line.
 *
 * Skipped with a warning when backend/.env is absent — that file is what
 * carries DATABASE_URL, so there is nothing to reset against (and no server
 * to talk to either). Any other failure aborts the run: a suite that starts
 * dirty would only reproduce the same failures, one layer up.
 */
export default async function globalSetup(): Promise<void> {
  const backendDir = path.join(fileURLToPath(new URL('../../../../', import.meta.url)), 'backend')

  if (!existsSync(path.join(backendDir, '.env'))) {
    console.warn(
      '[global-setup] backend/.env not found — skipping the E2E booking-state reset.',
    )
    return
  }

  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn('node', ['--env-file=.env', 'scripts/reset-e2e-state.ts'], {
      cwd: backendDir,
      stdio: 'inherit',
    })
    child.on('error', (err) => {
      console.error(`[global-setup] could not run reset-e2e-state: ${err.message}`)
      resolve(1)
    })
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)))
  })

  if (exitCode !== 0) {
    throw new Error(
      `reset-e2e-state exited with code ${exitCode}. Check backend/.env, or run ` +
        '`npm run reset:e2e-state` in backend/ to see the error directly.',
    )
  }
}
