const fs = require('fs');
const p =
  'c:\\Users\\poki\\Desktop\\Web App\\btp-karaoke\\frontend\\tests\\e2e\\booking\\blockouts.spec.ts';
let content = fs.readFileSync(p, 'utf8');
const eol = '\r\n';
// 1. Replace both page.goto('/admin/blocked-days') with helper call
content = content.split("await page.goto('/admin/blocked-days')").join('await openBlockedDaysModal(page)');
// 2. Remove the stale 'Blocked days' heading check line
content = content.split(
  "      await expect(page.getByRole('heading', { name: 'Blocked days' })).toBeVisible()" + eol,
).join('');
// 3. Insert helper before test.describe (keep CRLF)
const helper =
  '  async function openBlockedDaysModal(page: Page) {' +
  eol +
  "    await page.goto('/admin')" +
  eol +
  "    await page.locator('aside').getByRole('button', { name: 'Blocked Days' }).click()" +
  eol +
  "    await expect(page.getByRole('heading', { name: 'Studio closures' })).toBeVisible()" +
  eol +
  '  }' +
  eol;
content = content.split("test.describe('studio closures', () => {").join(helper + "test.describe('studio closures', () => {");
fs.writeFileSync(p, content);
console.log('done');
