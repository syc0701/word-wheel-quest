#!/usr/bin/env node
/**
 * Capture App Store screenshots from puzzleinteract.com word-wheel scenes.
 * Default: 10 locales × 2 devices × 10 scenes → ios/fastlane/screenshots/<locale>/
 *
 * Env (same names as puzzle-app where possible):
 *   SNAPSHOT_LANGUAGES=en-US,fr-FR   — subset of Apple locale folders
 *   SNAPSHOT_DEVICES=iPhone 15 Plus,iPad Pro 13-inch (M4)
 *   SNAPSHOT_IPHONE_ONLY=1           — skip iPad
 *   SCREENSHOT_START / SCREENSHOT_END — scene range (default 1–10)
 *   CLEAR_SCREENSHOTS=1              — wipe locale output folders before capture
 */

const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');
const {
  parseLocaleFilter,
  parseDeviceFilter,
  sceneSlugs,
  snapshotName,
  buildSceneUrl,
  screenshotsRoot,
} = require('./screenshot-config');

function mirrorEnUsToEnCa(root) {
  const src = path.join(root, 'en-US');
  const dest = path.join(root, 'en-CA');
  if (!fs.existsSync(src)) return 0;

  const pngs = fs.readdirSync(src).filter((f) => f.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) return 0;

  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(dest)) {
    if (file.toLowerCase().endsWith('.png')) {
      fs.unlinkSync(path.join(dest, file));
    }
  }

  let copied = 0;
  for (const file of pngs) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
    copied += 1;
  }
  console.log(`Mirrored ${copied} PNG(s) en-US → en-CA`);
  return copied;
}

function clearLocaleDirs(root, localeCodes) {
  for (const locale of localeCodes) {
    const dir = path.join(root, locale);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.toLowerCase().endsWith('.png')) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }
}

async function createContext(browser, deviceConfig) {
  const preset = devices[deviceConfig.playwrightPreset] ?? {};
  return browser.newContext({
    ...preset,
    locale: 'en-US',
    viewport: deviceConfig.viewport,
    deviceScaleFactor: deviceConfig.deviceScaleFactor,
  });
}

async function capture() {
  const locales = parseLocaleFilter();
  const deviceList = parseDeviceFilter();
  const slugs = sceneSlugs();
  const root = screenshotsRoot();
  const localeCodes = locales.map((l) => l.locale);

  if (process.env.CLEAR_SCREENSHOTS === '1') {
    clearLocaleDirs(root, localeCodes);
    console.log(`Cleared PNGs in ${localeCodes.join(', ')}`);
  }

  const expected = locales.length * deviceList.length * slugs.length;
  console.log(
    `Capturing ${slugs.length} scenes × ${deviceList.length} devices × ${locales.length} locales = ${expected} PNGs`
  );

  const browser = await chromium.launch({ headless: true });
  let captured = 0;
  let failed = 0;

  for (const { locale, lang } of locales) {
    const outDir = path.join(root, locale);
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`\n[${locale}] lang=${lang}`);

    for (const deviceConfig of deviceList) {
      console.log(`  ${deviceConfig.name} (${deviceConfig.pixelSize})`);
      const context = await createContext(browser, deviceConfig);

      for (const slug of slugs) {
        const url = buildSceneUrl(slug, lang);
        const filename = `${deviceConfig.name}-${snapshotName(slug)}.png`;
        const outFile = path.join(outDir, filename);
        const page = await context.newPage();

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: outFile, type: 'png' });
          captured += 1;
          console.log(`    ✓ ${slug} → ${filename}`);
        } catch (error) {
          failed += 1;
          console.error(`    ✗ ${slug} (${url}): ${error.message}`);
          process.exitCode = 1;
        } finally {
          await page.close();
        }
      }

      await context.close();
    }
  }

  await browser.close();

  if (locales.some((l) => l.locale === 'en-US')) {
    mirrorEnUsToEnCa(root);
  }

  console.log(`\nDone. ${captured} captured, ${failed} failed (expected ${expected}).`);
  console.log(`Output: ${root}`);
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
