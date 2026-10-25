import { test, expect } from '../fixtures'
import { ANONYMOUS } from '../helpers/auth'

/**
 * The /services sheet is public content: it renders from
 * `frontend/src/pages/services/data.ts` and never reads the database.
 *
 * `reducedMotion` keeps the GSAP scroll reveals from holding sections at
 * `visibility: hidden` until they are scrolled into view, so the assertions can
 * describe content instead of scroll choreography.
 */
test.describe('services', () => {
  test.use({ storageState: ANONYMOUS, reducedMotion: 'reduce' })

  test('SERVICES-001: the service sheet lists groups, cards and prices', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/services')

    await expect(page.getByRole('heading', { level: 1, name: 'BTP Music Production' })).toBeVisible()
    await expect(page.getByText('FILSCAP-Accredited Studio Services')).toBeVisible()
    await expect(page.getByText('Your Music, Our Passion, Your Success!')).toBeVisible()

    const production = page.locator('section#production')
    await expect(
      production.getByRole('heading', { level: 2, name: 'Music Production & Recording' }),
    ).toBeVisible()
    await expect(production.getByRole('heading', { level: 3 })).toHaveCount(4)

    const recording = production.locator('article').filter({ hasText: 'Music and Vocal Recording' })
    await expect(recording).toContainText('₱500')
    await expect(recording).toContainText('per hour')

    const video = production.locator('article').filter({ hasText: 'Karaoke Music Video Production' })
    await expect(video).toContainText('Starting at ₱1,000')
    await expect(video).toContainText('per video')

    const lessons = page.locator('section#lessons')
    await expect(
      lessons.getByRole('heading', { level: 2, name: 'Music Lessons & Artist Development' }),
    ).toBeVisible()
    await expect(lessons.getByRole('heading', { level: 3 })).toHaveCount(2)
    await expect(lessons).toContainText('Improve your vocal performance and musical skills')

    const entertainment = page.locator('section#entertainment')
    await expect(
      entertainment.getByRole('heading', { level: 2, name: 'Vocalists, Artists & Entertainment' }),
    ).toBeVisible()
    await expect(entertainment.getByRole('heading', { level: 3 })).toHaveCount(3)
    await expect(entertainment).toContainText(
      'Artist booking fees and sound system rental rates may vary',
    )

    // Contact details live on /contact only — the sheet must cross-link, not
    // repeat the address, phone number or email.
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0)
    await expect(page.locator('main a[href^="tel:"]')).toHaveCount(0)
  })

  test('SERVICES-002: the FILSCAP panel shows assistance, fee and disclaimer', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/services')

    const filscap = page.locator('section').filter({
      has: page.getByRole('heading', {
        level: 2,
        name: 'FILSCAP Membership & Musical Works Assistance',
      }),
    })

    await expect(filscap).toBeVisible()
    await expect(filscap.getByText('Administrative Assistance Fee')).toBeVisible()
    await expect(filscap.getByText('Starting at ₱2,500')).toBeVisible()
    await expect(filscap.getByText('Our assistance may include')).toBeVisible()
    await expect(filscap.locator('ul li')).toHaveCount(5)
    await expect(filscap).toContainText('Important:')
    await expect(filscap).toContainText('does not guarantee approval or royalty earnings')

    const ask = filscap.getByRole('link', { name: 'Ask about assistance' })
    await expect(ask).toHaveAttribute('href', '/contact')
    await ask.click()
    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { level: 1, name: 'Direct Lines' })).toBeVisible()
  })

  test('SERVICES-003: the subscription and VIP panels show plans and benefits', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/services')

    const subscription = page.locator('section').filter({
      has: page.getByRole('heading', { level: 2, name: 'BTP Music Online Subscription' }),
    })
    await expect(subscription).toBeVisible()
    await expect(subscription.locator('article')).toHaveCount(2)
    await expect(subscription.getByText('Monthly Subscription')).toBeVisible()
    await expect(subscription.getByText('₱20')).toBeVisible()
    await expect(subscription.getByText('per month')).toBeVisible()
    await expect(subscription.getByText('Annual Subscription')).toBeVisible()
    await expect(subscription.getByText('₱180')).toBeVisible()
    await expect(subscription.getByText('per year')).toBeVisible()
    await expect(subscription.getByText('Subscription benefits may include')).toBeVisible()
    await expect(subscription.locator('ul li')).toHaveCount(4)
    await expect(subscription).toContainText('subject to the applicable subscription terms')

    const vip = page.locator('section').filter({
      has: page.getByRole('heading', {
        level: 2,
        name: 'BTP Music Production VIP Membership Card',
      }),
    })
    await expect(vip).toBeVisible()
    await expect(vip.getByText('20% OFF', { exact: true })).toBeVisible()
    await expect(vip.getByText('VIP Member Benefit')).toBeVisible()
    await expect(vip.getByText('20% discount on eligible services.')).toBeVisible()
    await expect(vip.locator('ul li')).toHaveCount(7)
    await expect(vip).toContainText('VIP membership terms and conditions apply')
  })

  test('SERVICES-004: the header and inquiry CTAs lead to /services and /contact', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/')

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services' }).click()
    await expect(page).toHaveURL('/services')
    await expect(page.getByRole('heading', { level: 1, name: 'BTP Music Production' })).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services' }),
    ).toHaveAttribute('aria-current', 'page')

    await page.getByRole('link', { name: 'Inquire & Book' }).click()
    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { level: 1, name: 'Direct Lines' })).toBeVisible()

    await page.goto('/services')
    await page.getByRole('main').getByRole('link', { name: 'Contact Us' }).click()
    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { level: 1, name: 'Direct Lines' })).toBeVisible()
  })
})
