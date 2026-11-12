// Screenshot docs/redesign-shots/glyph-preview.html at 390px.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('.cache/browsers');
const {chromium} = await import(pathToFileURL(resolve('frontend/node_modules/playwright/index.mjs')).href);

const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 390, height: 1200}, deviceScaleFactor: 2});
await page.goto(pathToFileURL(resolve('docs/redesign-shots/glyph-preview.html')).href);
await page.screenshot({path: resolve('docs/redesign-shots/glyph-preview.png'), fullPage: true});
await browser.close();
console.log('ok');
