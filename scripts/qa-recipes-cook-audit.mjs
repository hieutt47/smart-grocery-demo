// QA Audit Script
import {resolve} from 'node:path';
import {existsSync, statSync} from 'node:fs';

const repoRoot = resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || resolve(repoRoot, '.cache/browsers');
const {chromium} = await import('../frontend/node_modules/playwright/index.mjs');

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8000';
console.log('Script loaded successfully');
