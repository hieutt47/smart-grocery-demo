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

  // 1. Add item to cart first
  await page.goto(`${baseURL}/products`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(600);

  // Click "+" button on first 2 products
  const addButtons = page.locator('.product-card .add-button');
  const count = await addButtons.count();
  if (count > 0) {
    await addButtons.nth(0).click();
    await page.waitForTimeout(400);
    if (count > 1) {
      await addButtons.nth(1).click();
      await page.waitForTimeout(400);
    }
  }

  // 2. Test /cart
  await page.goto(`${baseURL}/cart`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  const cartMetrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const items = [...document.querySelectorAll('.cart-row')];
    const qtyButtons = [...document.querySelectorAll('.quantity button')];
    const minQtyBtn = qtyButtons.length ? Math.min(...qtyButtons.map(b => b.getBoundingClientRect().height)) : 0;
    const delButtons = [...document.querySelectorAll('.delete-btn')];
    const minDelBtn = delButtons.length ? Math.min(...delButtons.map(b => b.getBoundingClientRect().height)) : 0;
    const ctaBtn = document.querySelector('.summary-card .button.primary');
    const ctaHeight = ctaBtn ? ctaBtn.getBoundingClientRect().height : 0;

    return {
      overflow,
      itemCount: items.length,
      qtyButtonsCount: qtyButtons.length,
      minQtyBtn,
      minDelBtn,
      ctaHeight
    };
  });

  // 3. Test /checkout
  await page.goto(`${baseURL}/checkout`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  const fillBtn = page.locator('.fill-sample-btn');
  if (await fillBtn.count()) {
    await fillBtn.click();
    await page.waitForTimeout(400);
  }

  const checkoutMetrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const fillBtn = document.querySelector('.fill-sample-btn');
    const fillBtnHeight = fillBtn ? fillBtn.getBoundingClientRect().height : 0;
    const inputs = [...document.querySelectorAll('.checkout-form input:not([type="radio"])')];
    const minInputHeight = inputs.length ? Math.min(...inputs.map(i => i.getBoundingClientRect().height)) : 0;
    const radioCards = [...document.querySelectorAll('.delivery-option-card')];
    const minRadioHeight = radioCards.length ? Math.min(...radioCards.map(r => r.getBoundingClientRect().height)) : 0;
    const submitBtn = document.querySelector('.summary-card .button.primary');
    const submitHeight = submitBtn ? submitBtn.getBoundingClientRect().height : 0;

    return {
      overflow,
      fillBtnHeight,
      inputsCount: inputs.length,
      minInputHeight,
      radioCardsCount: radioCards.length,
      minRadioHeight,
      submitHeight
    };
  });

  results[width] = {
    cartMetrics,
    checkoutMetrics,
    consoleErrors
  };

  if (width === 390) {
    // Capture /cart
    await page.goto(`${baseURL}/cart`, {waitUntil: 'networkidle'});
    await page.waitForTimeout(400);
    await page.screenshot({path: resolve(outDir, 'cart-mobile-390-top.png')});

    await page.evaluate(() => {
      const nav = document.querySelector('.mobile-nav');
      if (nav) nav.style.position = 'absolute';
    });
    await page.waitForTimeout(200);
    await page.screenshot({path: resolve(outDir, 'cart-mobile-390-full.png'), fullPage: true});

    // Capture /checkout
    await page.goto(`${baseURL}/checkout`, {waitUntil: 'networkidle'});
    await page.waitForTimeout(400);
    const fillBtn2 = page.locator('.fill-sample-btn');
    if (await fillBtn2.count()) {
      await fillBtn2.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({path: resolve(outDir, 'checkout-mobile-390-top.png')});

    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);
    await page.screenshot({path: resolve(outDir, 'checkout-mobile-390-middle.png')});

    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const nav = document.querySelector('.mobile-nav');
      if (nav) nav.style.position = 'absolute';
    });
    await page.waitForTimeout(200);
    await page.screenshot({path: resolve(outDir, 'checkout-mobile-390-full.png'), fullPage: true});
  }

  await context.close();
}

// Capture Desktop
const deskCtx = await browser.newContext({
  viewport: {width: 1280, height: 900},
  deviceScaleFactor: 1.5
});
const deskPage = await deskCtx.newPage();

await deskPage.goto(`${baseURL}/cart`, {waitUntil: 'networkidle'});
await deskPage.waitForTimeout(400);
await deskPage.screenshot({path: resolve(outDir, 'cart-desktop.png')});

await deskPage.goto(`${baseURL}/checkout`, {waitUntil: 'networkidle'});
await deskPage.waitForTimeout(400);
const fillDesk = deskPage.locator('.fill-sample-btn');
if (await fillDesk.count()) {
  await fillDesk.click();
  await deskPage.waitForTimeout(400);
}
await deskPage.screenshot({path: resolve(outDir, 'checkout-desktop.png')});

await deskCtx.close();
await browser.close();

console.log(JSON.stringify(results, null, 2));
