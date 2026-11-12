import {resolve} from 'node:path';
const repoRoot = resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(repoRoot, '.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');
const browser = await chromium.launch({headless: true});

function lum(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parse(c) {
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? {r: +m[1], g: +m[2], b: +m[3]} : null;
}

function ratio(c1, c2) {
  const l1 = lum(c1.r, c1.g, c1.b);
  const l2 = lum(c2.r, c2.g, c2.b);
  return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
}

const res = {};
for (const w of [360, 390]) {
  const page = await browser.newPage({viewport: {width: w, height: 844}});
  
  // Recipes
  await page.goto('http://127.0.0.1:8000/recipes', {waitUntil: 'networkidle'});
  const rec = await page.evaluate(() => {
    const list = [
      {sel: '.page-title h1', name: 'Title'},
      {sel: '.page-title .eyebrow', name: 'Eyebrow'},
      {sel: '.recipes-assistant-text span', name: 'AssistantText'},
      {sel: '.recipes-assistant-banner .text-link', name: 'AssistantLink'},
      {sel: '.chip', name: 'Chip'},
      {sel: '.chip.active', name: 'ChipActive'},
      {sel: '.list-count', name: 'ListCount'},
      {sel: '.list-subtext', name: 'ListSubtext'},
      {sel: '.recipe-card h3', name: 'RecipeCardH3'},
      {sel: '.recipe-tag-badge', name: 'RecipeTag'},
      {sel: '.recipe-time-badge', name: 'RecipeTime'}
    ];
    return list.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return null;
      let cur = el;
      let bg = 'rgb(247, 248, 246)';
      while (cur && cur !== document.documentElement) {
        const b = getComputedStyle(cur).backgroundColor;
        if (b && b !== 'transparent' && !b.includes('rgba(0, 0, 0, 0)')) { bg = b; break; }
        cur = cur.parentElement;
      }
      return {name: item.name, text: el.textContent.trim().slice(0, 30), color: getComputedStyle(el).color, bg};
    }).filter(Boolean);
  });

  // Cook
  await page.goto('http://127.0.0.1:8000/cook?ids=ga-rang-gung', {waitUntil: 'networkidle'});
  const btn = page.locator('.section-heading button.text-button');
  if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(500); }

  const cook = await page.evaluate(() => {
    const mb = document.querySelector('.cook-mobile-bar');
    const mbBtn = mb ? mb.querySelector('.cook-mobile-bar-btn') : null;
    const mbBtnRect = mbBtn ? mbBtn.getBoundingClientRect() : null;

    const list = [
      {sel: '.cook-single-info h1', name: 'CookTitle'},
      {sel: '.cook-meta-pill', name: 'CookMetaPill'},
      {sel: '.cook-summary-note', name: 'CookSummary'},
      {sel: '.section-heading h2', name: 'HeadingH2'},
      {sel: '.ingredient-name', name: 'IngredientName'},
      {sel: '.ingredient-pack', name: 'IngredientPack'},
      {sel: '.ingredient-price', name: 'IngredientPrice'},
      {sel: '.step-number', name: 'StepNumber'},
      {sel: '.step-text', name: 'StepText'},
      {sel: '.cook-mobile-bar-price', name: 'MobileBarPrice'},
      {sel: '.cook-mobile-bar-btn', name: 'MobileBarBtn'}
    ];
    const items = list.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return null;
      let cur = el;
      let bg = 'rgb(247, 248, 246)';
      while (cur && cur !== document.documentElement) {
        const b = getComputedStyle(cur).backgroundColor;
        if (b && b !== 'transparent' && !b.includes('rgba(0, 0, 0, 0)')) { bg = b; break; }
        cur = cur.parentElement;
      }
      return {name: item.name, text: el.textContent.trim().slice(0, 30), color: getComputedStyle(el).color, bg};
    }).filter(Boolean);

    return {
      mbBtnSize: mbBtnRect ? {w: Math.round(mbBtnRect.width), h: Math.round(mbBtnRect.height)} : null,
      items
    };
  });

  await page.close();
  res[w] = {rec, cook};
}

await browser.close();

for (const [w, data] of Object.entries(res)) {
  for (const item of data.rec) {
    const c1 = parse(item.color);
    const c2 = parse(item.bg);
    item.ratio = (c1 && c2) ? ratio(c1, c2) : null;
    item.pass = item.ratio ? item.ratio >= 4.5 : false;
  }
  for (const item of data.cook.items) {
    const c1 = parse(item.color);
    const c2 = parse(item.bg);
    item.ratio = (c1 && c2) ? ratio(c1, c2) : null;
    item.pass = item.ratio ? item.ratio >= 4.5 : false;
  }
}

console.log(JSON.stringify(res, null, 2));
