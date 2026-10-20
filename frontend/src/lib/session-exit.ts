let sessionExit = false

export function markSessionExit(value: boolean) {
  sessionExit = value
}

export function isSessionExitInProgress() {
  return sessionExit
}
