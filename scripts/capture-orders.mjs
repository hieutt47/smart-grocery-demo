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

  // 1. Add item and checkout to create an order
  await page.goto(`${baseURL}/products`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  const addBtn = page.locator('.product-card .add-button').first();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(400);
  }

  await page.goto(`${baseURL}/checkout`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  const fillBtn = page.locator('.fill-sample-btn');
  if (await fillBtn.count()) {
    await fillBtn.click();
    await page.waitForTimeout(300);
  }

  // Click verify then place
  const verifyBtn = page.getByRole('button', {name: 'Kiểm tra & chốt đơn'});
  if (await verifyBtn.count()) {
    await verifyBtn.click();
    await page.waitForTimeout(500);
  }
  const placeBtn = page.getByRole('button', {name: 'Tạo đơn mô phỏng'});
  if (await placeBtn.count()) {
    await placeBtn.click();
    await page.waitForTimeout(800);
  }

  // Now we are on /orders/:id!
  const orderUrl = page.url();

  const detailMetrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const trackingCard = document.querySelector('.tracking-card');
    const routeVisual = document.querySelector('.route-visual');
    const timeline = document.querySelector('.timeline');
    const simulationBtns = [...document.querySelectorAll('.simulation-buttons-row button')];
    const minSimBtn = simulationBtns.length ? Math.min(...simulationBtns.map(b => b.getBoundingClientRect().height)) : 0;
    const reorderBtn = document.querySelector('.summary-card button');
    const reorderBtnHeight = reorderBtn ? reorderBtn.getBoundingClientRect().height : 0;

    return {
      overflow,
      hasTrackingCard: Boolean(trackingCard),
      hasRouteVisual: Boolean(routeVisual),
      hasTimeline: Boolean(timeline),
      simulationBtnsCount: simulationBtns.length,
      minSimBtn,
      reorderBtnHeight
    };
  });

  // Now test /orders list
  await page.goto(`${baseURL}/orders`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  const listMetrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const orderCards = [...document.querySelectorAll('.order-card')];
    const minOrderCardHeight = orderCards.length ? Math.min(...orderCards.map(c => c.getBoundingClientRect().height)) : 0;

    return {
      overflow,
      orderCardsCount: orderCards.length,
      minOrderCardHeight
    };
  });

  results[width] = {
    detailMetrics,
    listMetrics,
    consoleErrors
  };

  if (width === 390) {
    // Capture /orders
    await page.screenshot({path: resolve(outDir, 'orders-mobile-390-top.png')});

    // Capture /orders/:id
    await page.goto(orderUrl, {waitUntil: 'networkidle'});
    await page.waitForTimeout(400);
    await page.screenshot({path: resolve(outDir, 'order-detail-mobile-390-top.png')});

    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(300);
    await page.screenshot({path: resolve(outDir, 'order-detail-mobile-390-middle.png')});

    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const nav = document.querySelector('.mobile-nav');
      if (nav) nav.style.position = 'absolute';
    });
    await page.waitForTimeout(200);
    await page.screenshot({path: resolve(outDir, 'order-detail-mobile-390-full.png'), fullPage: true});
  }

  await context.close();
}

// Capture Desktop
const deskCtx = await browser.newContext({
  viewport: {width: 1280, height: 900},
  deviceScaleFactor: 1.5
});
const deskPage = await deskCtx.newPage();

await deskPage.goto(`${baseURL}/orders`, {waitUntil: 'networkidle'});
await deskPage.waitForTimeout(400);
await deskPage.screenshot({path: resolve(outDir, 'orders-desktop.png')});

const firstOrderLink = deskPage.locator('.order-card').first();
if (await firstOrderLink.count()) {
  await firstOrderLink.click();
  await deskPage.waitForTimeout(500);
  await deskPage.screenshot({path: resolve(outDir, 'order-detail-desktop.png')});
}

await deskCtx.close();
await browser.close();

console.log(JSON.stringify(results, null, 2));
