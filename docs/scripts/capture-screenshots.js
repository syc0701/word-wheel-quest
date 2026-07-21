#!/usr/bin/env node
/**
 * Capture Play Store screenshots from word-wheel prototype scenes.
 *
 * Default: scenes 01–08 × all 10 locales × phone + 7-inch + 10-inch tablet
 * → fastlane/metadata/android/<locale>/images/{phone,sevenInch,tenInch}Screenshots/
 * (Play Store allows max 8 screenshots per device type per language.)
 *
 * Env:
 *   SNAPSHOT_LANGUAGES=all|en-US,fr-FR   — Play locale folders (default: all 10)
 *   SCREENSHOT_DEVICES=all|phone,sevenInch,tenInch — device types (default: all)
 *   SCREENSHOT_START / SCREENSHOT_END — scene range (default 1–8)
 *   CLEAR_SCREENSHOTS=1              — wipe PNG outputs before capture
 *   SCREENSHOT_BASE_URL              — override base URL
 *     default: https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  parseLocaleFilter,
  parseDeviceFilter,
  sceneSlugs,
  buildSceneUrl,
  screenshotsDir,
} = require('./screenshot-config');

function clearDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file.toLowerCase().endsWith('.png')) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

async function capture() {
  const locales = parseLocaleFilter();
  const devices = parseDeviceFilter();
  const slugs = sceneSlugs();
  const expected = locales.length * devices.length * slugs.length;

  console.log(
    `Capturing ${slugs.length} scenes × ${locales.length} locales × ${devices.length} devices = ${expected} PNGs`
  );
  for (const device of devices) {
    console.log(
      `  - ${device.name}: ${device.viewport.width}×${device.viewport.height} → ${device.playFolder}/`
    );
  }

  const browser = await chromium.launch({ headless: true });
  let captured = 0;
  let failed = 0;

  for (const { locale, lang } of locales) {
    console.log(`\n[${locale}] lang=${lang}`);

    for (const device of devices) {
      const outDir = screenshotsDir(locale, device.playFolder);
      fs.mkdirSync(outDir, { recursive: true });

      if (process.env.CLEAR_SCREENSHOTS === '1') {
        clearDir(outDir);
        console.log(`  Cleared PNGs in ${device.playFolder}/`);
      }

      console.log(`  ${device.name} (${device.viewport.width}×${device.viewport.height})`);
      const context = await browser.newContext({
        locale: lang === 'en' ? 'en-US' : lang,
        viewport: device.viewport,
        deviceScaleFactor: device.deviceScaleFactor,
      });

      for (const slug of slugs) {
        const url = buildSceneUrl(slug, lang);
        const outFile = path.join(outDir, `${slug}.png`);
        const page = await context.newPage();

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: outFile, type: 'png', fullPage: false });
          captured += 1;
          console.log(`    ✓ ${slug} → ${path.relative(process.cwd(), outFile)}`);
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
  console.log(`\nDone. ${captured} captured, ${failed} failed (expected ${expected}).`);
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
