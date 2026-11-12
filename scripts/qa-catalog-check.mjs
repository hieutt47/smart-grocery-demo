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

  await page.goto(`${baseURL}/products`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(800);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;

    const addBtn = document.querySelector('.add-button');
    const ab = addBtn ? addBtn.getBoundingClientRect() : null;

    const cards = [...document.querySelectorAll('.product-card')];
    const vh = window.innerHeight;
    const rowsAboveFold = new Set(
      cards.filter(c => {
        const r = c.getBoundingClientRect();
        return r.top < vh && r.bottom > 0;
      }).map(c => Math.round(c.getBoundingClientRect().top))
    ).size;

    const filterRow = document.querySelector('.filter-row');
    const filterPos = filterRow ? getComputedStyle(filterRow).position : null;

    const hint = document.querySelector('.catalog-assistant-hint');
    const grid = document.querySelector('.catalog-grid');
    const hintBeforeCards = hint && grid
      ? hint.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_PRECEDING ? true : false
      : null;
    const firstGridCards = grid ? grid.querySelectorAll('.product-card').length : 0;
    const allGrids = [...document.querySelectorAll('.catalog-grid')].map(g => g.querySelectorAll('.product-card').length);
    const gridIndex = grid ? [...grid.parentElement.children].indexOf(grid) : -1;
    const hintIndex = hint ? [...hint.parentElement.children].indexOf(hint) : -1;

    const loadMore = document.querySelector('.load-more-button');
    const placeholder = document.querySelector('.product-placeholder');
    const placeholderText = placeholder ? placeholder.textContent.trim() : null;
    const placeholderSvgCount = placeholder ? placeholder.querySelectorAll('svg').length : 0;
    const originInCard = document.querySelector('.product-origin-text');

    const metaText = document.querySelector('.list-meta')?.textContent?.trim() || null;

    return {
      overflow,
      innerWidth: window.innerWidth,
      scrollWidth: doc.scrollWidth,
      addButton: ab ? {w: Math.round(ab.width), h: Math.round(ab.height)} : null,
      visibleCardRowsAboveFold: rowsAboveFold,
      totalCardsRendered: cards.length,
      filterPosition: filterPos,
      gridsCardCounts: allGrids,
      hintSiblingIndex: hintIndex,
      gridSiblingIndex: gridIndex,
      hintAfterFirstGrid: hintIndex > gridIndex,
      hintText: hint ? hint.textContent.trim().slice(0, 80) : null,
      hasLoadMore: Boolean(loadMore),
      loadMoreText: loadMore ? loadMore.textContent.trim() : null,
      placeholderText,
      placeholderSvgCount,
      originTextStillInCard: Boolean(originInCard),
      metaText
    };
  });

  results[width] = {metrics, consoleErrors};

  if (width === 390) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({path: resolve(outDir, 'catalog-mobile-390-top.png')});

    const hintEl = page.locator('.catalog-assistant-hint');
    if (await hintEl.count()) {
      const top = await hintEl.first().evaluate(el => el.getBoundingClientRect().top + window.scrollY);
      await page.evaluate(y => window.scrollTo(0, y - 80), top);
      await page.waitForTimeout(400);
      await page.screenshot({path: resolve(outDir, 'catalog-mobile-390-middle.png')});
    }

    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const nav = document.querySelector('.mobile-nav');
      if (nav) nav.style.position = 'absolute';
    });
    await page.waitForTimeout(300);
    await page.screenshot({path: resolve(outDir, 'catalog-mobile-390-full.png'), fullPage: true});
  }

  await context.close();
}

// sticky check: scroll and confirm filter row stays near the top
{
  const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  const page = await context.newPage();
  await page.goto(`${baseURL}/products`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  const stickyTop = await page.evaluate(() => {
    const el = document.querySelector('.filter-row');
    if (!el) return null;
    return Math.round(el.getBoundingClientRect().top);
  });
  results.stickyCheck = {filterRowTopAfterScrolling900: stickyTop};
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
