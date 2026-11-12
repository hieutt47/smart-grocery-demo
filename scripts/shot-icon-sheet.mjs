// Screenshot the Lucide contact sheet (docs/redesign-shots/icon-sheet.html).
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('.cache/browsers');
const {chromium} = await import(pathToFileURL(resolve('frontend/node_modules/playwright/index.mjs')).href);

const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 1000, height: 1200}});
await page.goto(pathToFileURL(resolve('docs/redesign-shots/icon-sheet.html')).href);
await page.screenshot({path: resolve('docs/redesign-shots/icon-sheet.png'), fullPage: true});
await browser.close();
console.log('ok');
