#!/usr/bin/env node
/**
 * Preflight check before Fastlane screenshot upload.
 */

const path = require('path');
const config = require('./screenshot-config');

const root = config.screenshotsRoot();
const locales = config.LOCALES.map(({ locale }) => locale);

let total = 0;
const lines = [];

for (const locale of locales) {
  const pngs = config.listLocaleScreenshots(locale);
  if (pngs.length === 0) continue;

  const byDevice = {};
  for (const filePath of pngs) {
    const device = config.deviceLabelFromFile(filePath);
    byDevice[device] = (byDevice[device] || 0) + 1;
  }

  total += pngs.length;
  const devices = Object.entries(byDevice)
    .map(([name, count]) => `${name} (${count})`)
    .join(', ');
  lines.push(`  ${locale}: ${pngs.length} — ${devices}`);
}

console.log(`[${config.platform}] Screenshots in ${root}`);
if (lines.length === 0) {
  console.error('\nNo PNG files found.');
  console.error(`Capture first:  ${config.captureCommandHint()}`);
  process.exit(1);
}

lines.forEach((line) => console.log(line));
console.log(`\nTotal: ${total} PNG(s)`);

const primaryDir = path.join(root, config.PRIMARY_LOCALE);
const primaryIphone = config
  .listLocaleScreenshots(config.PRIMARY_LOCALE)
  .map((filePath) => path.basename(filePath))
  .filter((name) => name.startsWith('iPhone') && name.endsWith('.png'));

if (config.platform === 'ios' && primaryIphone.length < 3) {
  console.error(`\n${config.PRIMARY_LOCALE} needs at least 3 iPhone screenshots (App Store primary locale).`);
  console.error(`Run:  ${config.captureCommandHint()}`);
  process.exit(1);
}

if (config.platform === 'ios') {
  console.log(`\nOK — ready to upload. Primary locale: ${config.PRIMARY_LOCALE} (English Canada)`);
  console.log('In App Store Connect: Distribution → iOS App → version → English (Canada)');
  console.log('Then open iPhone 6.7" and iPad 13" screenshot slots.');
  console.log('\nUpload:  npm run ios:screenshots:upload-only');
  console.log('(Requires ios/fastlane/asc_api_key.env — copy from asc_api_key.env.example)');
} else {
  console.log(`\nOK — ready to upload to Google Play (${config.PRIMARY_LOCALE} + other locales).`);
}
