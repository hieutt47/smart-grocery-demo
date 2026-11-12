import {resolve} from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({
  viewport: {width: 390, height: 844},
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});

const page = await context.newPage();
await page.goto(baseURL, {waitUntil: 'networkidle'});
await page.waitForTimeout(600);

// Check horizontal scroll
const overflowInfo = await page.evaluate(() => {
  return {
    winWidth: window.innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
    totalHeight: document.documentElement.scrollHeight
  };
});
console.log('Mobile 390px scroll verification:', overflowInfo);

// Photo 1: Top of page (Hero & Promise strip)
await page.evaluate(() => window.scrollTo(0, 40));
await page.waitForTimeout(300);
await page.screenshot({path: resolve('homepage-mobile-390-1-hero.png')});
console.log('Captured Photo 1: Hero & Promise strip');

// Photo 2: Categories & Products
const marketEl = await page.locator('.fresh-market');
const marketTop = await marketEl.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo(0, y - 10), marketTop);
await page.waitForTimeout(300);
await page.screenshot({path: resolve('homepage-mobile-390-2-categories-products.png')});
console.log('Captured Photo 2: Categories & Products');

// Photo 3: Inspiration & Recipes
const inspirationEl = await page.locator('.fresh-inspiration');
const inspirationTop = await inspirationEl.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo(0, y - 10), inspirationTop);
await page.waitForTimeout(300);
await page.screenshot({path: resolve('homepage-mobile-390-3-inspiration-recipes.png')});
console.log('Captured Photo 3: Inspiration & Recipes');

// Photo 4: Delivery & Footer
const deliveryEl = await page.locator('.fresh-delivery');
const deliveryTop = await deliveryEl.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo(0, y - 10), deliveryTop);
await page.waitForTimeout(300);
await page.screenshot({path: resolve('homepage-mobile-390-4-delivery-footer.png')});
console.log('Captured Photo 4: Delivery & Footer');

await browser.close();
console.log('Done capturing all 4 mobile screenshots.');

import {copyFileSync, writeFileSync} from 'node:fs';
const files = [
  'homepage-mobile-390-1-hero.png',
  'homepage-mobile-390-2-categories-products.png',
  'homepage-mobile-390-3-inspiration-recipes.png',
  'homepage-mobile-390-4-delivery-footer.png'
];
for (const f of files) {
  copyFileSync(resolve(f), resolve('frontend/dist', f));
}

const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bữa Nhà · 4 Ảnh Mobile 390px (De-boxed & Warm)</title>
  <style>
    body { margin: 0; background: #e8e3d8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1c1917; padding: 24px 16px; }
    h1 { text-align: center; font-size: 20px; margin: 0 0 6px; color: #0f3d2e; }
    p.sub { text-align: center; font-size: 14px; color: #666; margin: 0 0 24px; }
    .gallery { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; }
    .card { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); width: 390px; max-width: 100%; }
    .card-title { padding: 12px 18px; font-weight: 700; font-size: 14px; background: #0f3d2e; color: #fff; display: flex; justify-content: space-between; align-items: center; }
    .card-title a { color: #86efac; text-decoration: none; font-size: 12px; }
    .card-title a:hover { text-decoration: underline; }
    .card img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <h1>Bữa Nhà · 4 Ảnh Trang Chủ Mobile 390px</h1>
  <p class="sub">Tông kem ấm gia đình · Bỏ đóng hộp · Dải màu xen kẽ mép-tới-mép</p>
  <div class="gallery">
    <div class="card">
      <div class="card-title"><span>1. Hero & Dải 3 cam kết</span><a href="/homepage-mobile-390-1-hero.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/homepage-mobile-390-1-hero.png" alt="Ảnh 1: Hero & Dải 3 cam kết">
    </div>
    <div class="card">
      <div class="card-title"><span>2. Danh mục tròn & Sản phẩm</span><a href="/homepage-mobile-390-2-categories-products.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/homepage-mobile-390-2-categories-products.png" alt="Ảnh 2: Danh mục tròn & Sản phẩm">
    </div>
    <div class="card">
      <div class="card-title"><span>3. Dải gợi ý & Công thức</span><a href="/homepage-mobile-390-3-inspiration-recipes.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/homepage-mobile-390-3-inspiration-recipes.png" alt="Ảnh 3: Dải gợi ý & Công thức">
    </div>
    <div class="card">
      <div class="card-title"><span>4. Giao hàng & Chân trang</span><a href="/homepage-mobile-390-4-delivery-footer.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/homepage-mobile-390-4-delivery-footer.png" alt="Ảnh 4: Giao hàng & Chân trang">
    </div>
  </div>
</body>
</html>`;

writeFileSync(resolve('frontend/dist/preview.html'), html, 'utf-8');
console.log('Copied screenshots to frontend/dist/ and generated preview.html');
