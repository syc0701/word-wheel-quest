#!/usr/bin/env node
/**
 * Capture Play Store phone screenshots from puzzleinteract.com word-wheel scenes.
 *
 * Default: scenes 01–08 → fastlane/metadata/android/en-US/images/phoneScreenshots/
 * (Play Store allows max 8 phone screenshots per language.)
 *
 * Env:
 *   SNAPSHOT_LANGUAGES=en-US,fr-FR   — Play locale folders (default: en-US)
 *   SCREENSHOT_START / SCREENSHOT_END — scene range (default 1–8)
 *   CLEAR_SCREENSHOTS=1              — wipe PNG outputs before capture
 *   SCREENSHOT_BASE_URL              — override base URL
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  parseLocaleFilter,
  sceneSlugs,
  buildSceneUrl,
  phoneScreenshotsDir,
  PHONE,
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
  const slugs = sceneSlugs();
  const expected = locales.length * slugs.length;

  console.log(
    `Capturing ${slugs.length} scenes × ${locales.length} locales = ${expected} PNGs @ ${PHONE.viewport.width}×${PHONE.viewport.height}`
  );

  const browser = await chromium.launch({ headless: true });
  let captured = 0;
  let failed = 0;

  for (const { locale, lang } of locales) {
    const outDir = phoneScreenshotsDir(locale);
    fs.mkdirSync(outDir, { recursive: true });

    if (process.env.CLEAR_SCREENSHOTS === '1') {
      clearDir(outDir);
      console.log(`Cleared PNGs in ${outDir}`);
    }

    console.log(`\n[${locale}] lang=${lang}`);
    const context = await browser.newContext({
      locale: lang === 'en' ? 'en-US' : lang,
      viewport: PHONE.viewport,
      deviceScaleFactor: PHONE.deviceScaleFactor,
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
        console.log(`  ✓ ${slug} → ${path.relative(process.cwd(), outFile)}`);
      } catch (error) {
        failed += 1;
        console.error(`  ✗ ${slug} (${url}): ${error.message}`);
        process.exitCode = 1;
      } finally {
        await page.close();
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nDone. ${captured} captured, ${failed} failed (expected ${expected}).`);
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
