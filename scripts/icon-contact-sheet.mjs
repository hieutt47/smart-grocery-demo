// Renders a contact sheet of candidate Lucide icons so the per-product icon
// mapping can be chosen by eye instead of by guessing from icon names.
// Usage: node scripts/icon-contact-sheet.mjs   (then open docs/redesign-shots/icon-sheet.html)
import {writeFileSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const frontend = resolve('frontend');
const nm = (p) => pathToFileURL(resolve(frontend, 'node_modules', p)).href;
const iconDir = resolve(frontend, 'node_modules/lucide-react/dist/esm/icons');

const groups = {
  'Thịt & cá': ['drumstick', 'beef', 'ham', 'bone', 'fish', 'shell', 'worm', 'bird', 'flame'],
  'Trứng & đậu': ['egg', 'egg-fried', 'milk', 'nut', 'bean', 'vegan', 'snowflake'],
  'Rau củ': ['carrot', 'leafy-green', 'leaf', 'sprout', 'flower-2', 'clover', 'sun', 'soup', 'salad', 'popcorn', 'donut', 'torus', 'umbrella', 'candy'],
  'Gạo & gia vị': ['wheat', 'droplet', 'droplets', 'container', 'amphora', 'flask-round', 'pill-bottle', 'scale', 'cookie', 'cake', 'package', 'box'],
  'Trái cây': ['banana', 'apple', 'citrus', 'cherry', 'grape', 'lollipop', 'croissant'],
  'Dụng cụ / nơi chốn': ['warehouse', 'store', 'truck', 'chef-hat', 'cooking-pot', 'utensils', 'slice', 'pizza', 'microwave', 'cup-soda', 'wine', 'coffee']
};

const react = await import(nm('react/index.js'));
const {renderToStaticMarkup} = await import(nm('react-dom/server.node.js'));
const h = react.createElement;

const rendered = {};
for (const name of new Set(Object.values(groups).flat())) {
  const Icon = (await import(pathToFileURL(resolve(iconDir, `${name}.js`)).href)).default;
  rendered[name] = renderToStaticMarkup(h(Icon, {size: 44, strokeWidth: 1.5, color: 'currentColor'}));
}

let html = `<!doctype html>
<meta charset="utf-8">
<title>Lucide contact sheet</title>
<style>
  body { font-family: system-ui, sans-serif; background: #faf7f2; color: #1c1917; margin: 0; padding: 24px; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 22px 0 8px; color: #15803d; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; }
  .cell { width: 104px; background: #efe9de; border-radius: 12px; padding: 12px 6px 8px; text-align: center; }
  .cell svg { width: 44px; height: 44px; color: #15803d; }
  .cell span { display: block; font-size: 10px; margin-top: 6px; word-break: break-word; color: #44403c; }
</style>
<h1>Ứng viên icon Lucide cho placeholder sản phẩm</h1>`;

for (const [group, names] of Object.entries(groups)) {
  html += `\n<h2>${group}</h2>\n<div class="row">`;
  for (const n of names) html += `\n  <div class="cell">${rendered[n]}<span>${n}</span></div>`;
  html += `\n</div>`;
}

const outDir = resolve('docs/redesign-shots');
mkdirSync(outDir, {recursive: true});
const out = resolve(outDir, 'icon-sheet.html');
writeFileSync(out, html);
console.log(`wrote ${out}`);
