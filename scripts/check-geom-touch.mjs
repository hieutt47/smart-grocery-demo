import {resolve} from 'node:path';
const repoRoot = resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(repoRoot, '.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');
const browser = await chromium.launch({headless: true});
const res = {};
for (const w of [360, 390]) {
  const page = await browser.newPage({viewport: {width: w, height: 844}});
  const cErrors = [];
  page.on('console', m => { if (m.type() === 'error') cErrors.push(m.text()); });
  page.on('pageerror', e => cErrors.push(e.message || String(e)));
  await page.goto('http://127.0.0.1:8000/recipes', {waitUntil: 'networkidle'});
  await page.waitForTimeout(400);
  const rec = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const chips = [...document.querySelectorAll('.chip')].map(c => {
      const r = c.getBoundingClientRect();
      return {text: c.textContent.trim(), w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10};
    });
    const bannerLink = document.querySelector('.recipes-assistant-banner .text-link');
    const blr = bannerLink ? bannerLink.getBoundingClientRect() : null;
    const nav = [...document.querySelectorAll('.mobile-nav a')].map(a => {
      const r = a.getBoundingClientRect();
      return {label: a.querySelector('small')?.textContent.trim(), w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10};
    });
    return {overflow, chips, bannerLink: blr ? {w: Math.round(blr.width*10)/10, h: Math.round(blr.height*10)/10} : null, nav};
  });
  await page.goto('http://127.0.0.1:8000/cook?ids=ga-rang-gung', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  const beforeSelect = await page.evaluate(() => {
    const b = document.querySelector('.cook-mobile-bar');
    return {hasBar: Boolean(b), display: b ? getComputedStyle(b).display : 'none'};
  });
  const selectBtn = page.locator('.section-heading button.text-button');
  if (await selectBtn.count()) {
    await selectBtn.first().click();
    await page.waitForTimeout(600);
  }
  const afterSelect = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const qty = [...document.querySelectorAll('.servings-control .qty-btn, .quantity .qty-btn')].map(b => {
      const r = b.getBoundingClientRect();
      return {label: b.getAttribute('aria-label') || b.textContent.trim(), w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10};
    });
    const sBtn = document.querySelector('.section-heading button.text-button');
    const sbr = sBtn ? sBtn.getBoundingClientRect() : null;
    const items = [...document.querySelectorAll('.ingredient-item')].map(i => {
      const r = i.getBoundingClientRect();
      return {name: i.querySelector('.ingredient-name')?.textContent.trim(), h: Math.round(r.height*10)/10};
    });
    const mb = document.querySelector('.cook-mobile-bar');
    const nav = document.querySelector('.mobile-nav');
    let mbR = null, navR = null;
    if (mb) {
      const r = mb.getBoundingClientRect();
      const btn = mb.querySelector('.cook-mobile-bar-btn');
      const br = btn ? btn.getBoundingClientRect() : null;
      mbR = {
        top: Math.round(r.top*10)/10,
        bottom: Math.round(r.bottom*10)/10,
        height: Math.round(r.height*10)/10,
        zIndex: parseInt(getComputedStyle(mb).zIndex, 10),
        price: mb.querySelector('.cook-mobile-bar-price')?.textContent.trim(),
        label: mb.querySelector('.cook-mobile-bar-label')?.textContent.trim(),
        btn: br ? {text: btn.textContent.trim(), w: Math.round(br.width*10)/10, h: Math.round(br.height*10)/10} : null
      };
    }
    if (nav) {
      const r = nav.getBoundingClientRect();
      navR = {
        top: Math.round(r.top*10)/10,
        bottom: Math.round(r.bottom*10)/10,
        height: Math.round(r.height*10)/10,
        zIndex: parseInt(getComputedStyle(nav).zIndex, 10)
      };
    }
    const sumBtn = document.querySelector('.summary-card .button.primary');
    const sumr = sumBtn ? sumBtn.getBoundingClientRect() : null;
    let barNavRelation = null;
    if (mbR && navR) {
      const verticalGap = Math.round((navR.top - mbR.bottom)*10)/10;
      const overlaps = !(mbR.bottom <= navR.top + 1);
      barNavRelation = {
        cookBarBottom: mbR.bottom,
        navTop: navR.top,
        verticalGap,
        overlaps,
        cookBarAboveNav: mbR.bottom <= navR.top + 1,
        navNotObscured: !overlaps
      };
    }
    return {
      overflow,
      qty,
      selectBtn: sbr ? {label: sBtn.textContent.trim(), w: Math.round(sbr.width*10)/10, h: Math.round(sbr.height*10)/10} : null,
      items,
      mbR,
      navR,
      barNavRelation,
      summaryBtn: sumr ? {w: Math.round(sumr.width*10)/10, h: Math.round(sumr.height*10)/10} : null
    };
  });
  res[w] = {cErrors, rec, cook: {beforeSelect, afterSelect}};
  await page.close();
}
await browser.close();
console.log(JSON.stringify(res, null, 2));