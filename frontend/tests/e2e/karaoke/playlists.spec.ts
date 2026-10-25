import { readFileSync } from 'node:fs'
import { test, expect } from '../fixtures'
import {
  createMediaItemAsAdmin,
  deleteMediaItemAsAdmin,
  uploadMediaFileAsAdmin,
} from '../helpers/media'

test.describe('playlists', () => {
  test('PLAYLIST-001: the library shows Liked Songs and five saved sets', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists')

    await expect(page.getByRole('heading', { level: 1, name: 'Playlists' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Liked Songs' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'Trending', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'Trending Audio' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'Trending Video' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your Playlists' })).toBeVisible()
    await expect(page.getByText('5 playlists · 35 tracks · 2h 18m')).toBeVisible()

    const cards = page.locator(
      'section[aria-labelledby="your-playlists-heading"] article',
    )
    await expect(cards).toHaveCount(5)
    await expect(cards.filter({ hasText: 'Late Night OPM' })).toHaveCount(1)
    await expect(cards.filter({ hasText: 'New Playlist' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'New Playlist' })).toBeVisible()

    const coverBox = await cards.first().locator('div.aspect-square').first().boundingBox()
    expect(coverBox).not.toBeNull()
    expect(coverBox!.width).toBeCloseTo(coverBox!.height, 0)
  })

  test('PLAYLIST-002: saved sets are not tied to a genre', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists')

    await expect(page.getByRole('button', { name: 'Filter playlists' })).toHaveCount(0)

    await page.getByRole('button', { name: 'New Playlist' }).click()
    const dialog = page.getByRole('dialog', { name: 'New playlist' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Genre')).toHaveCount(0)
    await dialog.getByLabel('Playlist name').fill('Lounge Warm-Up')
    await dialog.getByRole('button', { name: 'Create playlist' }).click()
    await expect(dialog).toBeHidden()

    const cards = page.locator(
      'section[aria-labelledby="your-playlists-heading"] article',
    )
    await expect(cards).toHaveCount(6)
    const created = cards.filter({ hasText: 'Lounge Warm-Up' })
    await expect(created).toHaveCount(1)
    await expect(created).toContainText(/0 songs/i)

    await created.getByRole('link', { name: 'Lounge Warm-Up', exact: true }).click()
    await expect(page).toHaveURL(/\/studio\/playlists\/lounge-warm-up/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Lounge Warm-Up' }),
    ).toBeVisible()
  })

  test('PLAYLIST-003: a saved set opens its tracklist and starts the console', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists/late-night-opm')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Late Night OPM' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tracklist' })).toBeVisible()
    const tracklist = page.getByRole('list', { name: 'Late Night OPM tracks' })
    await expect(tracklist.getByRole('listitem')).toHaveCount(9)
    await expect(tracklist.getByText('The Reason')).toBeVisible()

    await page.getByRole('button', { name: 'Play Late Night OPM', exact: true }).click()
    await expect(page).toHaveURL('/studio/player-queue')
    await expect(page.getByRole('contentinfo')).toContainText('The Reason')

    const queue = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Upcoming Lounge Queue' }) })
    await expect(queue.getByRole('button', { name: 'Remove The Reason' })).toBeVisible()
  })

  test('PLAYLIST-004: the New Playlist dialog adds a saved set', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists')

    await page.getByRole('button', { name: 'New Playlist' }).click()
    const dialog = page.getByRole('dialog', { name: 'New playlist' })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Playlist name').fill('Friday Night OPM')
    await dialog.getByLabel('Description').fill('A Friday set for the lounge.')
    await dialog.getByRole('button', { name: 'Create playlist' }).click()
    await expect(dialog).toBeHidden()

    const created = page.locator('main article').filter({ hasText: 'Friday Night OPM' })
    await expect(created).toHaveCount(1)
    await created.scrollIntoViewIfNeeded()
    await expect(created).toContainText(/0 songs/i)
  })

  test('PLAYLIST-005: a media card adds its song to a playlist', { tag: '@p1' }, async ({ page, baseURL }) => {
    const title = `E2E Playlist Add ${Date.now()}`
    // A music row never becomes the hub's first video card (h1 'The Reason').
    const upload = await uploadMediaFileAsAdmin(baseURL, {
      name: 'e2e-playlist-add.mp3',
      mimeType: 'audio/mpeg',
      data: readFileSync(new URL('../assets/silence.mp3', import.meta.url)),
    })
    expect(upload.status).toBe(201)
    const { id } = await createMediaItemAsAdmin(baseURL, {
      section: 'music',
      title,
      artist: 'E2E Artist',
      tag: 'TAPE',
      duration: '1:00',
      sourceUrl: upload.body.file!.url,
      sourceName: upload.body.file!.name,
    })

    try {
      await page.goto('/studio')

      const card = page.locator('main article').filter({ hasText: title })
      await card.getByRole('button', { name: `More options for ${title}` }).click()
      const menu = page.getByRole('dialog', { name: title })
      await expect(menu.getByRole('button', { name: 'Add to playlist' })).toBeEnabled()
      await menu.getByRole('button', { name: 'Add to playlist' }).click()

      const dialog = page.getByRole('dialog', { name: 'Add to playlist' })
      await expect(dialog).toBeVisible()
      const lateNight = dialog.getByRole('button', { name: /Late Night OPM/ })
      await expect(lateNight).toBeEnabled()
      await lateNight.click()
      await expect(dialog).toBeHidden()

      const notice = page.getByRole('status').filter({ hasText: 'Added to Late Night OPM' })
      await expect(notice).toBeVisible()
      await expect(notice).toBeHidden({ timeout: 4000 })

      // Reopening the picker reports the set that now holds the song as disabled.
      await card.getByRole('button', { name: `More options for ${title}` }).click()
      const savedMenu = page.getByRole('dialog', { name: title })
      await expect(savedMenu.getByRole('button', { name: 'Add to playlist' })).toBeEnabled()
      await savedMenu.getByRole('button', { name: 'Add to playlist' }).click()
      const savedPicker = page.getByRole('dialog', { name: 'Add to playlist' })
      await expect(savedPicker.getByRole('button', { name: /Late Night OPM/ })).toBeDisabled()
      await expect(savedPicker).toContainText('Already in this playlist')
      await savedPicker.getByRole('button', { name: 'Done' }).click()
      await expect(savedPicker).toBeHidden()

      await page.locator('header').getByRole('link', { name: 'Playlists' }).click()
      await expect(page).toHaveURL('/studio/playlists')

      const playlistCard = page.locator('main article').filter({ hasText: 'Late Night OPM' })
      await playlistCard.getByRole('link', { name: 'Late Night OPM', exact: true }).click()
      await expect(page).toHaveURL('/studio/playlists/late-night-opm')

      const tracklist = page.getByRole('list', { name: 'Late Night OPM tracks' })
      await expect(tracklist.getByText(title)).toBeVisible()
      await expect(tracklist.getByRole('listitem')).toHaveCount(10)
    } finally {
      await deleteMediaItemAsAdmin(baseURL, id)
    }
  })

  test('PLAYLIST-013: already-saved sets stay disabled inside the picker', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    const card = page.locator('main article').filter({ hasText: 'The Reason' }).first()
    await card.getByRole('button', { name: 'More options for The Reason' }).click()

    const menu = page.getByRole('dialog', { name: 'The Reason' })
    await expect(menu.getByRole('button', { name: 'Add to playlist' })).toBeEnabled()
    await menu.getByRole('button', { name: 'Add to playlist' }).click()

    const picker = page.getByRole('dialog', { name: 'Add to playlist' })
    await expect(picker).toBeVisible()
    for (const name of [/Late Night OPM/, /Duets & Harmonies/, /High-Energy KTV/]) {
      await expect(picker.getByRole('button', { name })).toBeDisabled()
    }
    await expect(picker.getByText('Already in this playlist')).toHaveCount(3)
    await expect(picker.getByRole('button', { name: /Acoustic Reset/ })).toBeEnabled()
    await expect(picker.getByRole('button', { name: /New Set Ideas/ })).toBeEnabled()

    await picker.getByRole('button', { name: 'Done' }).click()
    await expect(picker).toBeHidden()
  })

  test('PLAYLIST-006: a saved set can be deleted', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists')

    const library = page.locator(
      'section[aria-labelledby="your-playlists-heading"]',
    )
    const card = library.locator('article').filter({ hasText: 'New Set Ideas' })
    await expect(card).toHaveCount(1)

    await card.getByRole('button', { name: 'More options for New Set Ideas' }).click()
    await page.getByRole('button', { name: 'Delete playlist' }).click()

    const dialog = page.getByRole('dialog', { name: 'Delete playlist' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('New Set Ideas')
    await dialog.getByRole('button', { name: 'Delete playlist' }).click()

    await expect(card).toHaveCount(0)
    await expect(library.locator('article')).toHaveCount(4)
    await expect(page.getByText(/4 playlists · 35 tracks/)).toBeVisible()
  })

  test('PLAYLIST-007: a song can be removed from a playlist', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists/late-night-opm')

    const tracklist = page.getByRole('list', { name: 'Late Night OPM tracks' })
    const row = tracklist.getByRole('listitem').filter({ hasText: 'Die With A Smile' })
    await expect(row).toHaveCount(1)

    await row.getByRole('button', { name: 'Remove Die With A Smile from playlist' }).click()

    await expect(row).toHaveCount(0)
    await expect(tracklist.getByRole('listitem')).toHaveCount(8)
  })

  test(
    'PLAYLIST-008: the library shows a component-shaped loading skeleton',
    { tag: '@p1' },
    async ({ page }) => {
    await page.route('**/api/media', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900))
      await route.continue()
    })

    await page.goto('/studio/playlists')

    await expect(page.getByRole('status', { name: 'Loading playlists' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Playlists' })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Loading playlists' })).toHaveCount(0)
  })

  test(
    'PLAYLIST-009: a playlist detail shows its own loading skeleton',
    { tag: '@p1' },
    async ({ page }) => {
    await page.route('**/api/media', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900))
      await route.continue()
    })

    await page.goto('/studio/playlists/late-night-opm')

    await expect(page.getByRole('status', { name: 'Loading playlist' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Late Night OPM' }),
    ).toBeVisible()
    await expect(page.getByRole('status', { name: 'Loading playlist' })).toHaveCount(0)
  })

  test(
    'PLAYLIST-010: the detail shuffle button toggles on and off',
    { tag: '@p1' },
    async ({ page }) => {
    await page.goto('/studio/playlists/late-night-opm')

    const shuffle = page.getByRole('button', { name: 'Shuffle Late Night OPM' })
    await expect(shuffle).toHaveAttribute('aria-pressed', 'false')

    await shuffle.click()
    await expect(shuffle).toHaveAttribute('aria-pressed', 'true')
    await expect(shuffle).toHaveAttribute('title', 'Shuffle on')
    await expect(page).toHaveURL('/studio/playlists/late-night-opm')

    await shuffle.click()
    await expect(shuffle).toHaveAttribute('aria-pressed', 'false')
    await expect(shuffle).toHaveAttribute('title', 'Shuffle off')

    await shuffle.click()
    await page.getByRole('button', { name: 'Play Late Night OPM' }).click()
    await page.waitForURL('**/studio/player-queue')

    const barShuffle = page.getByRole('button', { name: 'Shuffle', exact: true })
    await expect(barShuffle).toHaveAttribute('aria-pressed', 'true')
    await barShuffle.click()
    await expect(barShuffle).toHaveAttribute('aria-pressed', 'false')
  })

  test('PLAYLIST-011: a saved set can be renamed from its card and detail', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists')

    const library = page.locator('section[aria-labelledby="your-playlists-heading"]')
    const card = library.locator('article').filter({ hasText: 'New Set Ideas' })
    await card.getByRole('button', { name: 'More options for New Set Ideas' }).click()
    await page.getByRole('button', { name: 'Rename playlist' }).click()

    const dialog = page.getByRole('dialog', { name: 'Rename playlist' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Playlist name')).toHaveValue('New Set Ideas')
    await dialog.getByLabel('Playlist name').fill('Sunday Sessions')
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(dialog).toBeHidden()

    await expect(card).toHaveCount(0)
    const renamed = library.locator('article').filter({ hasText: 'Sunday Sessions' })
    await expect(renamed).toHaveCount(1)
    await renamed.getByRole('link', { name: 'Sunday Sessions', exact: true }).click()
    await expect(page).toHaveURL('/studio/playlists/new-set-ideas')
    await expect(page.getByRole('heading', { level: 1, name: 'Sunday Sessions' })).toBeVisible()

    await page.getByRole('button', { name: 'Rename Sunday Sessions' }).click()
    const detailDialog = page.getByRole('dialog', { name: 'Rename playlist' })
    await detailDialog.getByLabel('Playlist name').fill('Sunday Unplugged')
    await detailDialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(detailDialog).toBeHidden()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sunday Unplugged' }),
    ).toBeVisible()
  })

  test('PLAYLIST-012: the player heart fills and clears Liked Songs', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page).toHaveURL('/studio/player-queue')

    const playerBar = page.getByRole('contentinfo')
    const like = playerBar.getByRole('button', { name: 'Like' })
    await expect(like).toHaveAttribute('aria-pressed', 'true')
    await like.click()
    await expect(like).toHaveAttribute('aria-pressed', 'false')

    await page.locator('header').getByRole('link', { name: 'Playlists' }).click()
    await expect(page).toHaveURL('/studio/playlists')
    const liked = page.locator('section[aria-labelledby="liked-songs-heading"]')
    await expect(liked).toContainText(/0 songs/i)
    await expect(liked.getByRole('button', { name: 'Play Liked Songs' })).toBeDisabled()

    await page.locator('header').getByRole('link', { name: 'Player Queue' }).click()
    await expect(page).toHaveURL('/studio/player-queue')
    const likeAgain = page.getByRole('contentinfo').getByRole('button', { name: 'Like' })
    await expect(likeAgain).toHaveAttribute('aria-pressed', 'false')
    await likeAgain.click()
    await expect(likeAgain).toHaveAttribute('aria-pressed', 'true')

    await page.locator('header').getByRole('link', { name: 'Playlists' }).click()
    await expect(liked).toContainText(/1 song/i)
    await expect(liked.getByRole('button', { name: 'Play Liked Songs' })).toBeEnabled()
  })
})
