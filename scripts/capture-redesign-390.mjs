import {resolve} from 'node:path';
import {copyFileSync, writeFileSync, mkdirSync} from 'node:fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');

const outDir = resolve('docs/redesign-shots');
mkdirSync(outDir, {recursive: true});

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({
  viewport: {width: 390, height: 844},
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});

const page = await context.newPage();

// --- 1. CAPTURE TRANG CHỦ (HOMEPAGE) ---
console.log('Navigating to Homepage at', baseURL);
await page.goto(baseURL, {waitUntil: 'networkidle'});
await page.waitForTimeout(600);

// Check horizontal scroll on Homepage
const homeScroll = await page.evaluate(() => ({
  winWidth: window.innerWidth,
  docScrollWidth: document.documentElement.scrollWidth,
  hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
  totalHeight: document.documentElement.scrollHeight
}));
console.log('Homepage 390px scroll verification:', homeScroll);

// Photo 1: Hero & Dải 3 cam kết
await page.evaluate(() => window.scrollTo(0, 40));
await page.waitForTimeout(300);
await page.screenshot({path: resolve(outDir, 'homepage-mobile-390-1-hero.png')});
console.log('Captured Photo 1: Hero & Dải 3 cam kết');

// Photo 2: Danh mục tròn & Sản phẩm thân quen
const marketEl = await page.locator('.fresh-market');
const marketTop = await marketEl.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo(0, y - 10), marketTop);
await page.waitForTimeout(300);
await page.screenshot({path: resolve(outDir, 'homepage-mobile-390-2-categories-products.png')});
console.log('Captured Photo 2: Danh mục & Sản phẩm');

// Photo 3: Dải gợi ý hôm nay (#A8491F) & Món quen cảm hứng mới
const inspirationEl = await page.locator('.fresh-inspiration');
const inspirationTop = await inspirationEl.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo(0, y - 10), inspirationTop);
await page.waitForTimeout(300);
await page.screenshot({path: resolve(outDir, 'homepage-mobile-390-3-inspiration-recipes.png')});
console.log('Captured Photo 3: Gợi ý & Công thức');

// Photo 4: Dải giao hàng xanh rừng (01/02/03 thẳng hàng) & Chân trang
const deliveryEl = await page.locator('.fresh-delivery');
const deliveryTop = await deliveryEl.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo(0, y - 10), deliveryTop);
await page.waitForTimeout(300);
await page.screenshot({path: resolve(outDir, 'homepage-mobile-390-4-delivery-footer.png')});
console.log('Captured Photo 4: Giao hàng & Chân trang');

// --- 2. CAPTURE TRANG ĐI CHỢ (CATALOG) ---
console.log('Navigating to Catalog at', `${baseURL}/products`);
await page.goto(`${baseURL}/products`, {waitUntil: 'networkidle'});
await page.waitForTimeout(600);

// Check horizontal scroll on Catalog
const catalogScroll = await page.evaluate(() => ({
  winWidth: window.innerWidth,
  docScrollWidth: document.documentElement.scrollWidth,
  hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
  totalHeight: document.documentElement.scrollHeight
}));
console.log('Catalog 390px scroll verification:', catalogScroll);

// Photo 5: Catalog Top (Tiêu đề, Tìm kiếm, Danh mục cuộn ngang, Dải gợi ý trợ lý nền yến mạch)
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({path: resolve(outDir, 'catalog-mobile-390-1-top.png')});
console.log('Captured Photo 5: Catalog Top');

// Photo 6: Catalog Products (Lưới sản phẩm de-boxed trên nền kem ấm)
const gridEl = await page.locator('.catalog-grid');
const gridTop = await gridEl.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
await page.evaluate(y => window.scrollTo(0, y - 60), gridTop);
await page.waitForTimeout(300);
await page.screenshot({path: resolve(outDir, 'catalog-mobile-390-2-products.png')});
console.log('Captured Photo 6: Catalog Products');

// Full page screenshot of Catalog
await page.screenshot({path: resolve(outDir, 'catalog-mobile-390-full.png'), fullPage: true});
console.log('Captured Full Page: Catalog');

await browser.close();

// Copy to frontend/dist so they can be viewed over HTTP or directly
const distShots = resolve('frontend/dist/shots');
mkdirSync(distShots, {recursive: true});

const files = [
  'homepage-mobile-390-1-hero.png',
  'homepage-mobile-390-2-categories-products.png',
  'homepage-mobile-390-3-inspiration-recipes.png',
  'homepage-mobile-390-4-delivery-footer.png',
  'catalog-mobile-390-1-top.png',
  'catalog-mobile-390-2-products.png',
  'catalog-mobile-390-full.png'
];
for (const f of files) {
  try {
    copyFileSync(resolve(outDir, f), resolve(distShots, f));
    try { copyFileSync(resolve(outDir, f), resolve(f)); } catch {}
  } catch (err) {
    console.error('Error copying file:', f, err);
  }
}

// Update preview.html
const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bữa Nhà · Ảnh Mobile 390px (Trang Chủ & Đi Chợ)</title>
  <style>
    body { margin: 0; background: #e8e3d8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1c1917; padding: 24px 16px; }
    h1 { text-align: center; font-size: 22px; margin: 0 0 6px; color: #0f3d2e; }
    p.sub { text-align: center; font-size: 14px; color: #555; margin: 0 0 24px; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.5; }
    .section-title { width: 100%; text-align: center; font-size: 17px; font-weight: 700; color: #0f3d2e; margin: 32px 0 16px; border-top: 1px solid #d5cebf; padding-top: 24px; }
    .gallery { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; }
    .card { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); width: 390px; max-width: 100%; }
    .card-title { padding: 12px 18px; font-weight: 700; font-size: 14px; background: #0f3d2e; color: #fff; display: flex; justify-content: space-between; align-items: center; }
    .card-title a { color: #86efac; text-decoration: none; font-size: 12px; }
    .card-title a:hover { text-decoration: underline; }
    .card img { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <h1>Bữa Nhà · Ảnh Xác Minh Mobile 390px</h1>
  <p class="sub">Tông kem ấm gia đình (#FAF7F2) · Bỏ đóng hộp · Căn lề chuẩn 24px · Dải màu xen kẽ mép-tới-mép</p>

  <div class="section-title">PHẦN 1: TRANG CHỦ (ĐÃ SỬA CĂN LỀ & CAM ĐẤT #A8491F)</div>
  <div class="gallery">
    <div class="card">
      <div class="card-title"><span>1. Hero & Dải 3 cam kết</span><a href="/shots/homepage-mobile-390-1-hero.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/shots/homepage-mobile-390-1-hero.png" alt="Ảnh 1: Hero & Dải 3 cam kết">
    </div>
    <div class="card">
      <div class="card-title"><span>2. Tiêu đề 24px & Sản phẩm</span><a href="/shots/homepage-mobile-390-2-categories-products.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/shots/homepage-mobile-390-2-categories-products.png" alt="Ảnh 2: Tiêu đề 24px & Sản phẩm">
    </div>
    <div class="card">
      <div class="card-title"><span>3. Dải gợi ý (#A8491F) & Công thức</span><a href="/shots/homepage-mobile-390-3-inspiration-recipes.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/shots/homepage-mobile-390-3-inspiration-recipes.png" alt="Ảnh 3: Dải gợi ý & Công thức">
    </div>
    <div class="card">
      <div class="card-title"><span>4. 3 bước 01/02/03 thẳng hàng</span><a href="/shots/homepage-mobile-390-4-delivery-footer.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/shots/homepage-mobile-390-4-delivery-footer.png" alt="Ảnh 4: 3 bước 01/02/03 thẳng hàng">
    </div>
  </div>

  <div class="section-title">PHẦN 2: TRANG ĐI CHỢ (CATALOG)</div>
  <div class="gallery">
    <div class="card">
      <div class="card-title"><span>5. Đi chợ: Tìm kiếm & Gợi ý trợ lý</span><a href="/shots/catalog-mobile-390-1-top.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/shots/catalog-mobile-390-1-top.png" alt="Ảnh 5: Đi chợ Tìm kiếm & Gợi ý trợ lý">
    </div>
    <div class="card">
      <div class="card-title"><span>6. Đi chợ: Lưới sản phẩm de-boxed</span><a href="/shots/catalog-mobile-390-2-products.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/shots/catalog-mobile-390-2-products.png" alt="Ảnh 6: Đi chợ Lưới sản phẩm">
    </div>
    <div class="card">
      <div class="card-title"><span>7. Đi chợ: Toàn trang (Full Page)</span><a href="/shots/catalog-mobile-390-full.png" target="_blank">Mở ảnh riêng ↗</a></div>
      <img src="/shots/catalog-mobile-390-full.png" alt="Ảnh 7: Toàn trang Đi chợ">
    </div>
  </div>
</body>
</html>`;

writeFileSync(resolve('frontend/dist/preview.html'), html, 'utf-8');
console.log('All screenshots ready and preview.html updated.');
