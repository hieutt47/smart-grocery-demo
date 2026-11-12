import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');

const outDir = resolve('docs/redesign-shots');
mkdirSync(outDir, {recursive: true});

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({headless: true});

function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(colorStr) {
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return {
    r: parseInt(m[1], 10),
    g: parseInt(m[2], 10),
    b: parseInt(m[3], 10),
    a: m[4] !== undefined ? parseFloat(m[4]) : 1
  };
}

function contrastRatio(rgb1, rgb2) {
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const report = {};

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
  await page.waitForTimeout(600);

  const data = await page.evaluate(() => {
    const searchBtn = document.querySelector('.commerce-search button[type="submit"]') || document.querySelector('.commerce-search button');
    const sbRect = searchBtn ? searchBtn.getBoundingClientRect() : null;

    const buttons = [...document.querySelectorAll('button, a.button, [role="button"]')];
    const buttonSizes = buttons.map(b => {
      const r = b.getBoundingClientRect();
      const text = (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30);
      return {
        tag: b.tagName,
        className: b.className,
        text,
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        meets44px: (r.width >= 43.5 && r.height >= 43.5)
      };
    });

    function getEffectiveBg(el) {
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const bg = getComputedStyle(cur).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m && (m[4] === undefined || parseFloat(m[4]) > 0.1)) {
          return bg;
        }
        cur = cur.parentElement;
      }
      return 'rgb(247, 248, 246)';
    }

    const textSelectors = [
      '.brand-title',
      '.commerce-search input',
      '.filter-chip',
      '.product-card h3',
      '.product-price',
      '.product-pack',
      '.product-category-tag',
      '.catalog-assistant-hint h3',
      '.catalog-assistant-hint p',
      '.load-more-button',
      '.list-meta'
    ];

    const contrastItems = [];
    for (const sel of textSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const cs = getComputedStyle(el);
        const color = cs.color;
        const bg = getEffectiveBg(el);
        const fontSize = cs.fontSize;
        const fontWeight = cs.fontWeight;
        contrastItems.push({
          selector: sel,
          text: el.textContent.trim().slice(0, 40),
          color,
          bg,
          fontSize,
          fontWeight
        });
      }
    }

    const scrollWidth = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;
    const overflow = scrollWidth - innerWidth;

    return {
      overflow,
      scrollWidth,
      innerWidth,
      searchButton: sbRect ? {w: Math.round(sbRect.width), h: Math.round(sbRect.height)} : null,
      buttonSizes,
      contrastItems
    };
  });

  data.contrastCalculations = data.contrastItems.map(item => {
    const cRgb = parseRgb(item.color);
    const bgRgb = parseRgb(item.bg);
    let ratio = null;
    let pass = false;
    if (cRgb && bgRgb) {
      ratio = Math.round(contrastRatio(cRgb, bgRgb) * 100) / 100;
      pass = ratio >= 4.5;
    }
    return {
      selector: item.selector,
      text: item.text,
      color: item.color,
      bg: item.bg,
      ratio,
      pass
    };
  });

  report[width] = {
    data,
    consoleErrors
  };

  if (width === 360) {
    await page.screenshot({path: resolve(outDir, 'catalog-mobile-360-top.png')});
    await page.screenshot({path: resolve(outDir, 'catalog-mobile-360-full.png'), fullPage: true});
  }

  await context.close();
}

{
  const context = await browser.newContext({viewport: {width: 1280, height: 900}});
  const page = await context.newPage();
  await page.goto(`${baseURL}/products`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(400);
  const desktopSearchBtn = await page.evaluate(() => {
    const sb = document.querySelector('.commerce-search button');
    if (!sb) return null;
    const r = sb.getBoundingClientRect();
    return {w: Math.round(r.width), h: Math.round(r.height)};
  });
  report.desktop1280 = {searchButton: desktopSearchBtn};
  await context.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
