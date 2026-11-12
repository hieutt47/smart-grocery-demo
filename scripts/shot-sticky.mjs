import {resolve} from 'node:path';
const repoRoot = resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(repoRoot, '.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');
const outDir = resolve(repoRoot, 'docs/redesign-shots');
const browser = await chromium.launch({headless: true});
for (const w of [360, 390]) {
  const page = await browser.newPage({viewport: {width: w, height: 844}});
  await page.goto('http://127.0.0.1:8000/cook?ids=ga-rang-gung', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  const btn = page.locator('.section-heading button.text-button');
  if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(700); }
  await page.screenshot({path: resolve(outDir, 'cook-mobile-' + w + '-sticky-viewport.png'), fullPage: false});
  await page.screenshot({path: resolve(outDir, 'cook-mobile-' + w + '-bottom-nav-composite.png'), clip: {x: 0, y: 844 - 180, width: w, height: 180}});
  await page.close();
}
await browser.close();
console.log('STICKY_SHOTS_CAPTURED');