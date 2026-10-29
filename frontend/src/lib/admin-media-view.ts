/**
 * The admin media hub's catalog layout: a card grid or compact rows. The
 * choice lives in localStorage so the console remembers it across visits —
 * it is pure display preference, never data.
 */
export type MediaHubView = 'grid' | 'list'

const STORAGE_KEY = 'btp.admin-media-view'

export function readMediaHubView(): MediaHubView {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function storeMediaHubView(view: MediaHubView): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, view)
  } catch {
    // Private mode or blocked storage: the toggle still works, it just
    // won't survive a reload.
  }
}
