// Renders the custom product glyphs from frontend/src/product-icons.tsx so they
// can be inspected next to the Lucide icons they sit beside in the catalog.
// Usage: node scripts/glyph-preview.mjs && open docs/redesign-shots/glyph-preview.png
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync, mkdirSync} from 'node:fs';

const frontend = resolve('frontend');
const nm = (p) => pathToFileURL(resolve(frontend, 'node_modules', p)).href;

const react = await import(nm('react/index.js'));
const {renderToStaticMarkup} = await import(nm('react-dom/server.node.js'));
const h = react.createElement;

// Inline React/JSX is not available here, so the glyphs are read from the real
// source module via esbuild-free transpilation: Vite's esbuild is already
// installed, and we only need the JSX turned into calls.
const {build} = await import(nm('esbuild/lib/main.js'));
const result = await build({
  entryPoints: [resolve(frontend, 'src/product-icons.tsx')],
  absWorkingDir: frontend,
  bundle: true,
  write: false,
  format: 'esm',
  jsx: 'automatic',
  logLevel: 'silent'
});
const code = result.outputFiles[0].text;
const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const mod = await import(dataUrl);

const lucideIcons = {
  Drumstick: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/drumstick.js')).href)).default,
  Beef: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/beef.js')).href)).default,
  Ham: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/ham.js')).href)).default,
  Fish: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/fish.js')).href)).default,
  Egg: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/egg.js')).href)).default,
  LeafyGreen: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/leafy-green.js')).href)).default,
  Leaf: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/leaf.js')).href)).default,
  Carrot: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/carrot.js')).href)).default,
  Salad: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/salad.js')).href)).default,
  Citrus: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/citrus.js')).href)).default,
  Amphora: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/amphora.js')).href)).default,
  Shell: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/shell.js')).href)).default,
  Banana: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/banana.js')).href)).default,
  Wheat: (await import(pathToFileURL(resolve(frontend, 'node_modules/lucide-react/dist/esm/icons/wheat.js')).href)).default
};

const rows = [
  ['Thịt & cá', [['chicken', 'Thịt gà', lucideIcons.Drumstick], ['beef', 'Thịt bò', lucideIcons.Beef], ['pork', 'Thịt heo', lucideIcons.Ham], ['fish', 'Cá thu', lucideIcons.Fish], ['shrimp', 'Tôm', lucideIcons.Shell]]],
  ['Trứng & đậu', [['eggs', 'Trứng gà', lucideIcons.Egg], ['tofu', 'Đậu hũ', mod.TofuIcon]]],
  ['Rau củ', [['tomato', 'Cà chua', mod.TomatoIcon], ['greens', 'Rau cải', lucideIcons.LeafyGreen], ['spinach', 'Rau muống', lucideIcons.Leaf], ['ginger', 'Gừng', mod.GingerIcon], ['garlic', 'Tỏi', mod.GarlicIcon], ['onion', 'Hành lá', mod.ScallionIcon], ['carrot', 'Cà rốt', lucideIcons.Carrot], ['potato', 'Khoai tây', mod.PotatoIcon], ['pumpkin', 'Bí đỏ', mod.PumpkinIcon], ['cucumber', 'Dưa leo', mod.CucumberIcon], ['lettuce', 'Xà lách', lucideIcons.Salad], ['mushroom', 'Nấm', mod.MushroomIcon], ['lime', 'Chanh', lucideIcons.Citrus]]],
  ['Gạo & gia vị', [['rice', 'Gạo thơm', mod.RiceBowlIcon], ['noodles', 'Mì sợi', mod.NoodleIcon], ['oil', 'Dầu ăn', mod.OilBottleIcon], ['fish-sauce', 'Nước mắm', lucideIcons.Amphora], ['soy-sauce', 'Nước tương', mod.SauceBottleIcon], ['salt', 'Muối', mod.SaltShakerIcon], ['sugar', 'Đường', mod.SugarBowlIcon], ['pepper', 'Tiêu', mod.PepperMillIcon]]],
  ['Trái cây', [['banana', 'Chuối', lucideIcons.Banana], ['orange', 'Cam', mod.OrangeIcon]]]
];

let html = `<!doctype html><meta charset="utf-8"><title>Glyph preview</title><style>
body{font-family:system-ui;background:#faf7f2;color:#1c1917;margin:0;padding:20px}
h2{font-size:13px;margin:18px 0 8px;color:#15803d}
.row{display:flex;flex-wrap:wrap;gap:10px}
.cell{width:92px}
.art{height:92px;background:#efe9de;border-radius:16px;display:grid;place-items:center;color:#15803d}
.art svg{width:44px;height:44px}
.cell span{display:block;font-size:11px;margin-top:5px;text-align:center}
</style>`;

for (const [group, items] of rows) {
  html += `<h2>${group}</h2><div class="row">`;
  for (const [, label, Icon] of items) {
    html += `<div class="cell"><div class="art">${renderToStaticMarkup(h(Icon, {size: 44, strokeWidth: 1.5, color: 'currentColor'}))}</div><span>${label}</span></div>`;
  }
  html += `</div>`;
}

mkdirSync(resolve('docs/redesign-shots'), {recursive: true});
writeFileSync(resolve('docs/redesign-shots/glyph-preview.html'), html);
console.log('wrote docs/redesign-shots/glyph-preview.html');
