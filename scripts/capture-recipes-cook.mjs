import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';

const repoRoot = resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || resolve(repoRoot, '.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');

const outDir = resolve(repoRoot, 'docs/redesign-shots');
mkdirSync(outDir, {recursive: true});

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({headless: true});

const results = {};

for (const width of [360, 390]) {
  const context = await browser.newContext({
    viewport: {width, height: 844},
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  // 1. Recipes page
  await page.goto(`${baseURL}/recipes`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(600);

  const recipesMetrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const cards = [...document.querySelectorAll('.recipe-card')];
    const chips = [...document.querySelectorAll('.chip')];
    const artworks = [...document.querySelectorAll('.recipe-photo-cover')].map(el => el.getAttribute('data-recipe-name') || el.getAttribute('aria-label') || el.getAttribute('src') || el.className);
    const uniqueArtworks = new Set(artworks);
    const badges = [...document.querySelectorAll('.recipe-tag-badge')].map(b => b.textContent?.trim());
    const banner = document.querySelector('.recipes-assistant-banner');

    return {
      overflow,
      cardCount: cards.length,
      uniqueArtworksCount: uniqueArtworks.size,
      artworksSample: artworks.slice(0, 4),
      chipsCount: chips.length,
      minChipHeight: chips.length ? Math.min(...chips.map(c => c.getBoundingClientRect().height)) : 0,
      badgesSample: badges.slice(0, 4),
      hasAssistantBanner: Boolean(banner)
    };
  });

  // 2. Cook page with single recipe
  await page.goto(`${baseURL}/cook?ids=ga-rang-gung`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(800);

  // Click on first 2 ingredients if not selected
  const cookMetrics = await page.evaluate(async () => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;

    const coverTitle = document.querySelector('.cook-single-info h1, .cook-cover-meta h2')?.textContent?.trim() || null;
    const hasSingleHero = Boolean(document.querySelector('.cook-single-hero'));
    const hasVisual = Boolean(document.querySelector('.cook-single-art, .cook-cover-thumb'));

    const items = [...document.querySelectorAll('.ingredient-item')];
    const selectedCount = items.filter(i => i.classList.contains('selected')).length;
    const minItemHeight = items.length ? Math.min(...items.map(i => i.getBoundingClientRect().height)) : 0;

    const mobileBar = document.querySelector('.cook-mobile-bar');
    const mbRect = mobileBar ? mobileBar.getBoundingClientRect() : null;
    const mbBtn = mobileBar ? mobileBar.querySelector('.cook-mobile-bar-btn') : null;
    const mbBtnRect = mbBtn ? mbBtn.getBoundingClientRect() : null;
    const mbPrice = mobileBar ? mobileBar.querySelector('.cook-mobile-bar-price')?.textContent?.trim() : null;

    const steps = [...document.querySelectorAll('.step-item')];

    return {
      overflow,
      coverTitle,
      hasSingleHero,
      hasVisual,
      ingredientItemsCount: items.length,
      selectedCount,
      minItemHeight,
      hasMobileBar: Boolean(mobileBar),
      mobileBarVisible: mbRect ? (mbRect.height > 0 && mbRect.top < window.innerHeight) : false,
      mobileBarPrice: mbPrice,
      mobileBarBtnSize: mbBtnRect ? {width: Math.round(mbBtnRect.width), height: Math.round(mbBtnRect.height)} : null,
      stepsCount: steps.length
    };
  });

  results[width] = {
    recipesMetrics,
    cookMetrics,
    consoleErrors
  };

  if (width === 390) {
    // Capture /recipes
    await page.goto(`${baseURL}/recipes`, {waitUntil: 'networkidle'});
    await page.waitForTimeout(400);
    await page.screenshot({path: resolve(outDir, 'recipes-mobile-390-top.png')});

    await page.evaluate(() => {
      const nav = document.querySelector('.mobile-nav');
      if (nav) nav.style.position = 'absolute';
    });
    await page.waitForTimeout(200);
    await page.screenshot({path: resolve(outDir, 'recipes-mobile-390-full.png'), fullPage: true});

    // Capture /cook
    await page.goto(`${baseURL}/cook?ids=ga-rang-gung`, {waitUntil: 'networkidle'});
    await page.waitForTimeout(600);

    // Select all ingredients to make sure quote is loaded and mobile bar shows
    const selectAllBtn = page.locator('.section-heading button.text-button');
    if (await selectAllBtn.count()) {
      await selectAllBtn.click();
      await page.waitForTimeout(600);
    }

    await page.screenshot({path: resolve(outDir, 'cook-mobile-390-top.png')});

    // Scroll to middle
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(300);
    await page.screenshot({path: resolve(outDir, 'cook-mobile-390-middle.png')});

    // Full page
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const nav = document.querySelector('.mobile-nav');
      if (nav) nav.style.position = 'absolute';
      const mbar = document.querySelector('.cook-mobile-bar');
      if (mbar) mbar.style.position = 'absolute';
    });
    await page.waitForTimeout(200);
    await page.screenshot({path: resolve(outDir, 'cook-mobile-390-full.png'), fullPage: true});
  }

  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
