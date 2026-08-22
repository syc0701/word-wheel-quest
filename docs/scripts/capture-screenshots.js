#!/usr/bin/env node
/**
 * Capture store screenshots from word-wheel prototype scenes.
 *
 * Android → fastlane/metadata/android/<locale>/images/…/
 * iOS     → ios/fastlane/screenshots/<locale>/iPhone 6.7"-01.png …
 *
 * Env:
 *   SCREENSHOT_PLATFORM=ios|android
 *   SNAPSHOT_LANGUAGES=all|en-CA,en-US,…
 *   SCREENSHOT_DEVICES=all|iphone67,ipad13|phone,sevenInch,tenInch
 *   SCREENSHOT_START / SCREENSHOT_END — scene range (default 1–8)
 *   CLEAR_SCREENSHOTS=1 — wipe matching PNG outputs before capture
 */

const path = require('path');
const { chromium } = require('playwright');
const config = require('./screenshot-config');

async function capture() {
  const locales = config.parseLocaleFilter();
  const devices = config.parseDeviceFilter();
  const slugs = config.sceneSlugs();
  const expected = locales.length * devices.length * slugs.length;

  console.log(
    `[${config.platform}] Capturing ${slugs.length} scenes × ${locales.length} locales × ${devices.length} devices = ${expected} PNGs`
  );
  for (const device of devices) {
    const target =
      config.platform === 'ios'
        ? `${device.filePrefix}-*.png`
        : `${device.playFolder}/`;
    console.log(
      `  - ${device.name}: ${device.viewport.width}×${device.viewport.height} → ${target}`
    );
  }

  const browser = await chromium.launch({ headless: true });
  let captured = 0;
  let failed = 0;

  for (const { locale, lang } of locales) {
    console.log(`\n[${locale}] lang=${lang}`);

    for (const device of devices) {
      const outDir = config.prepareOutputDir(locale, device);
      if (process.env.CLEAR_SCREENSHOTS === '1') {
        console.log(`  Cleared PNGs for ${device.name} in ${path.relative(process.cwd(), outDir)}`);
      }

      console.log(`  ${device.name} (${device.viewport.width}×${device.viewport.height})`);
      const context = await browser.newContext({
        locale: lang === 'en' ? 'en-US' : lang,
        viewport: device.viewport,
        deviceScaleFactor: device.deviceScaleFactor,
      });

      for (const slug of slugs) {
        const url = config.buildSceneUrl(slug, lang);
        const outFile = config.outputFile(locale, device, slug);
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
