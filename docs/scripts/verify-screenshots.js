#!/usr/bin/env node
/**
 * Preflight check before npm run ios:upload:screenshots
 */
const fs = require('fs');
const path = require('path');
const { screenshotsRoot } = require('./screenshot-config');

const root = screenshotsRoot();
const locales = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let total = 0;
const lines = [];

for (const locale of locales) {
  const dir = path.join(root, locale);
  const pngs = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) continue;

  const byDevice = {};
  for (const file of pngs) {
    const device = file.split('-')[0];
    byDevice[device] = (byDevice[device] || 0) + 1;
  }

  total += pngs.length;
  const devices = Object.entries(byDevice)
    .map(([name, count]) => `${name} (${count})`)
    .join(', ');
  lines.push(`  ${locale}: ${pngs.length} — ${devices}`);
}

console.log(`Screenshots in ${root}`);
if (lines.length === 0) {
  console.error('\nNo PNG files found.');
  console.error('Capture first:  npm run ios:screenshots:faster');
  process.exit(1);
}

lines.forEach((line) => console.log(line));
console.log(`\nTotal: ${total} PNG(s)`);

const enCaDir = path.join(root, 'en-CA');
const enCaIphone = fs.existsSync(enCaDir)
  ? fs.readdirSync(enCaDir).filter((f) => f.startsWith('iPhone') && f.endsWith('.png'))
  : [];

if (enCaIphone.length < 3) {
  console.error('\nen-CA needs at least 3 iPhone screenshots (App Store primary locale).');
  console.error('Run:  npm run ios:screenshots:faster');
  process.exit(1);
}

console.log('\nOK — ready to upload. Primary locale: en-CA (English Canada)');
console.log('In App Store Connect: Distribution → iOS App → 1.0 → English (Canada)');
console.log('Then open iPhone 6.7" and iPad 13" screenshot slots.');
