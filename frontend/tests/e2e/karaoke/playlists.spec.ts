import { test, expect } from '../fixtures'

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
    await expect(page.getByRole('button', { name: 'Filter playlists' })).toBeVisible()

    const coverBox = await cards.first().locator('div.aspect-square').first().boundingBox()
    expect(coverBox).not.toBeNull()
    expect(coverBox!.width).toBeCloseTo(coverBox!.height, 0)
  })

  test('PLAYLIST-002: the genre filter narrows the saved sets', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio/playlists')

    await page.getByRole('button', { name: 'Filter playlists' }).click()
    const menu = page.getByRole('dialog', { name: 'Filter playlists' })
    await expect(menu).toBeVisible()

    const opm = menu.getByRole('button', { name: /^OPM, 2 playlists$/ })
    await opm.click()
    await expect(opm).toHaveAttribute('aria-pressed', 'true')

    // Multi-select is OR: OPM (2 sets) + Rock (1 set) = 3 sets, no duplicates.
    const rock = menu.getByRole('button', { name: /^Rock, 1 playlist$/ })
    await rock.click()
    await expect(rock).toHaveAttribute('aria-pressed', 'true')
    await menu.getByRole('button', { name: 'Done' }).click()
    await expect(menu).toBeHidden()

    await expect(page.getByText('3 of 5 playlists')).toBeVisible()
    const cards = page.locator(
      'section[aria-labelledby="your-playlists-heading"] article',
    )
    await expect(cards).toHaveCount(3)
    await expect(cards.filter({ hasText: 'Late Night OPM' })).toHaveCount(1)
    await expect(cards.filter({ hasText: 'Acoustic Reset' })).toHaveCount(1)
    await expect(cards.filter({ hasText: 'High-Energy KTV' })).toHaveCount(1)
    await expect(cards.filter({ hasText: 'Duets & Harmonies' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Clear', exact: true }).click()
    await expect(cards).toHaveCount(5)
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
    await dialog.getByLabel('Genre').selectOption('OPM')
    await dialog.getByRole('button', { name: 'Create playlist' }).click()
    await expect(dialog).toBeHidden()

    const created = page.locator('main article').filter({ hasText: 'Friday Night OPM' })
    await expect(created).toHaveCount(1)
    await created.scrollIntoViewIfNeeded()
    await expect(created).toContainText(/0 songs/i)
  })

  test('PLAYLIST-005: a media card adds its song to a playlist', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    const card = page.locator('main article').filter({ hasText: 'The Reason' }).first()
    await card.getByRole('button', { name: 'More options for The Reason' }).click()
    const menu = page.getByRole('dialog', { name: 'The Reason' })
    await expect(menu.getByRole('button', { name: 'Add to playlist' })).toBeEnabled()
    await menu.getByRole('button', { name: 'Add to playlist' }).click()

    const dialog = page.getByRole('dialog', { name: 'Add to playlist' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Already added to 3 playlists/i)).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: /Late Night OPM/ })).toBeDisabled()
    const acoustic = dialog.getByRole('button', { name: /Acoustic Reset/ })
    await acoustic.click()
    await expect(dialog).toBeHidden()

    const notice = page.getByRole('status').filter({ hasText: 'Added to Acoustic Reset' })
    await expect(notice).toBeVisible()
    await expect(notice).toContainText('Also already in 3 other playlists')
    await expect(notice).toBeHidden({ timeout: 4000 })

    await page.locator('header').getByRole('link', { name: 'Playlists' }).click()
    await expect(page).toHaveURL('/studio/playlists')

    const playlistCard = page.locator('main article').filter({ hasText: 'Acoustic Reset' })
    await playlistCard.getByRole('link', { name: 'Acoustic Reset', exact: true }).click()
    await expect(page).toHaveURL('/studio/playlists/acoustic-reset')

    const tracklist = page.getByRole('list', { name: 'Acoustic Reset tracks' })
    await expect(tracklist.getByText('The Reason')).toBeVisible()
    await expect(tracklist.getByRole('listitem')).toHaveCount(7)
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
