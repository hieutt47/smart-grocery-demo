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

  // 1. Initial empty state
  await page.goto(`${baseURL}/assistant`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  const initialMetrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const promptPills = [...document.querySelectorAll('.prompt-pill')];
    const minPillHeight = promptPills.length ? Math.min(...promptPills.map(p => p.getBoundingClientRect().height)) : 0;
    const input = document.querySelector('.chat-input input');
    const inputHeight = input ? input.getBoundingClientRect().height : 0;
    const sendBtn = document.querySelector('.chat-send-btn');
    const sendBtnRect = sendBtn ? sendBtn.getBoundingClientRect() : null;

    return {
      overflow,
      promptPillsCount: promptPills.length,
      minPillHeight,
      inputHeight,
      sendBtnSize: sendBtnRect ? {width: Math.round(sendBtnRect.width), height: Math.round(sendBtnRect.height)} : null
    };
  });

  // 2. Send prompt to get recommendations with recipe visuals
  const searchInput = page.getByRole('textbox', {name: 'Nhập nhu cầu bữa ăn của bạn'});
  await searchInput.fill('Tối nay 2 người, 100k');
  await page.locator('.chat-send-btn').click();
  await page.waitForTimeout(1000);

  const conversationMetrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const userMsg = document.querySelector('.user-message');
    const assistantMsg = document.querySelector('.assistant-message');
    const suggestionCards = [...document.querySelectorAll('.suggestion-card')];
    const suggestionArtworks = [...document.querySelectorAll('.suggestion-art-visual')];
    const followups = [...document.querySelectorAll('.chat-followups .chip')];
    const minFollowupHeight = followups.length ? Math.min(...followups.map(f => f.getBoundingClientRect().height)) : 0;
    const ctaButtons = [...document.querySelectorAll('.suggestion-footer .button')];
    const minCtaHeight = ctaButtons.length ? Math.min(...ctaButtons.map(b => b.getBoundingClientRect().height)) : 0;

    return {
      overflow,
      hasUserMsg: Boolean(userMsg),
      hasAssistantMsg: Boolean(assistantMsg),
      suggestionCardsCount: suggestionCards.length,
      suggestionArtworksCount: suggestionArtworks.length,
      followupsCount: followups.length,
      minFollowupHeight,
      minCtaHeight
    };
  });

  results[width] = {
    initialMetrics,
    conversationMetrics,
    consoleErrors
  };

  if (width === 390) {
    // Screenshot conversation state top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({path: resolve(outDir, 'assistant-mobile-390-top.png')});

    // Screenshot scrolled to suggestion cards
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);
    await page.screenshot({path: resolve(outDir, 'assistant-mobile-390-middle.png')});

    // Full page
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const nav = document.querySelector('.mobile-nav');
      if (nav) nav.style.position = 'absolute';
    });
    await page.waitForTimeout(200);
    await page.screenshot({path: resolve(outDir, 'assistant-mobile-390-full.png'), fullPage: true});
  }

  await context.close();
}

// Also capture Desktop
const desktopCtx = await browser.newContext({
  viewport: {width: 1280, height: 900},
  deviceScaleFactor: 1.5
});
const desktopPage = await desktopCtx.newPage();
await desktopPage.goto(`${baseURL}/assistant`, {waitUntil: 'networkidle'});
await desktopPage.waitForTimeout(400);

const searchInputDesk = desktopPage.getByRole('textbox', {name: 'Nhập nhu cầu bữa ăn của bạn'});
await searchInputDesk.fill('Tối nay 2 người, 100k');
await desktopPage.locator('.chat-send-btn').click();
await desktopPage.waitForTimeout(1000);

await desktopPage.screenshot({path: resolve(outDir, 'assistant-desktop-chat.png')});
await desktopCtx.close();

await browser.close();
console.log(JSON.stringify(results, null, 2));
