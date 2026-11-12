import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');

const outDir = resolve('docs/redesign-shots');
mkdirSync(outDir, {recursive: true});

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({headless: true});

// Desktop 1280: check 4-column grid rows, sticky chip position vs header, banner spanning
const context = await browser.newContext({viewport: {width: 1280, height: 900}});
const page = await context.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${baseURL}/products`, {waitUntil: 'networkidle'});
await page.waitForTimeout(800);

const desktop = await page.evaluate(() => {
  const grid = document.querySelector('.catalog-grid');
  const cards = [...grid.querySelectorAll('.product-card')];
  const tops = cards.map(c => Math.round(c.getBoundingClientRect().top));
  const uniqueTops = [...new Set(tops)];
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;

  const hint = document.querySelector('.catalog-assistant-hint');
  const hintRect = hint ? hint.getBoundingClientRect() : null;
  const hintWidth = hintRect ? Math.round(hintRect.width) : null;
  const gridWidth = Math.round(grid.getBoundingClientRect().width);

  const headerEl = document.querySelector('.commerce-header');
  const headerRect = headerEl ? headerEl.getBoundingClientRect() : null;
  const filterRow = document.querySelector('.filter-row');

  return {
    colCount: cols,
    rowsOfCards: uniqueTops.length,
    cardsPerRowByTop: uniqueTops.map(t => tops.filter(x => x === t).length),
    hintSpansFullGrid: hintWidth !== null && Math.abs(hintWidth - gridWidth) < 2,
    hintWidth, gridWidth,
    headerHeight: headerRect ? Math.round(headerRect.height) : null
  };
});

await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForTimeout(500);

const stickyDesktop = await page.evaluate(() => {
  const filterRow = document.querySelector('.filter-row');
  const headerEl = document.querySelector('.commerce-header');
  const fr = filterRow.getBoundingClientRect();
  const hr = headerEl.getBoundingClientRect();
  return {
    filterTop: Math.round(fr.top),
    filterBottom: Math.round(fr.bottom),
    headerBottom: Math.round(hr.bottom),
    overlapsHeader: fr.top < hr.bottom,
    // is the chip row clickable (not covered)?
    elementAtFilterCenter: (() => {
      const el = document.elementFromPoint(fr.left + 40, fr.top + fr.height / 2);
      return el ? el.className || el.tagName : null;
    })()
  };
});

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({path: resolve(outDir, 'catalog-desktop-1280-top.png')});

await context.close();
await browser.close();

console.log(JSON.stringify({desktop, stickyDesktop, consoleErrors: errors}, null, 2));
