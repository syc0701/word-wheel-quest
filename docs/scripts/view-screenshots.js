#!/usr/bin/env node
/**
 * Build a local HTML gallery of captured App Store screenshots and open in Chrome.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { screenshotsRoot } = require('./screenshot-config');

const OUT_FILE = path.join(screenshotsRoot(), 'gallery.html');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function deviceSortKey(name) {
  return name.startsWith('iPhone') ? `0-${name}` : `1-${name}`;
}

function buildGallery() {
  const root = screenshotsRoot();
  if (!fs.existsSync(root)) {
    throw new Error(`Screenshots folder not found: ${root}`);
  }

  const locales = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const sections = [];

  for (const locale of locales) {
    const dir = path.join(root, locale);
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.png'))
      .sort((a, b) => {
        const deviceA = a.split('-')[0];
        const deviceB = b.split('-')[0];
        const byDevice = deviceSortKey(a).localeCompare(deviceSortKey(b));
        if (byDevice !== 0) return byDevice;
        return a.localeCompare(b, undefined, { numeric: true });
      });

    if (files.length === 0) continue;

    const cards = files
      .map((file) => {
        const rel = `${locale}/${file}`;
        return `
          <figure class="card">
            <a href="${escapeHtml(rel)}" target="_blank" rel="noopener">
              <img src="${escapeHtml(rel)}" alt="${escapeHtml(file)}" loading="lazy" />
            </a>
            <figcaption>${escapeHtml(file)}</figcaption>
          </figure>`;
      })
      .join('\n');

    sections.push(`
      <section id="${escapeHtml(locale)}" class="locale-section">
        <h2>${escapeHtml(locale)} <span class="count">${files.length} PNGs</span></h2>
        <div class="grid">${cards}</div>
      </section>`);
  }

  if (sections.length === 0) {
    throw new Error('No PNG screenshots found. Run npm run screenshots:ios first.');
  }

  const nav = locales
    .filter((locale) => fs.readdirSync(path.join(root, locale)).some((f) => f.endsWith('.png')))
    .map((locale) => `<a href="#${escapeHtml(locale)}">${escapeHtml(locale)}</a>`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Word Wheel Quest — Screenshot Gallery</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f1419;
      color: #e7ecf3;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      background: rgba(15, 20, 25, 0.92);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid #243041;
      padding: 16px 20px;
    }
    h1 { margin: 0 0 12px; font-size: 20px; }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    nav a {
      color: #9ecbff;
      text-decoration: none;
      padding: 6px 10px;
      border-radius: 999px;
      background: #1a2433;
      font-size: 13px;
    }
    nav a:hover { background: #243041; }
    main { padding: 20px; }
    .locale-section { margin-bottom: 40px; }
    .locale-section h2 {
      margin: 0 0 16px;
      font-size: 18px;
      border-bottom: 1px solid #243041;
      padding-bottom: 8px;
    }
    .count {
      color: #8b98a8;
      font-size: 14px;
      font-weight: 500;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .card {
      margin: 0;
      background: #151c26;
      border: 1px solid #243041;
      border-radius: 12px;
      overflow: hidden;
    }
    .card img {
      display: block;
      width: 100%;
      height: auto;
      background: #000;
    }
    figcaption {
      padding: 8px 10px;
      font-size: 11px;
      color: #8b98a8;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <header>
    <h1>Word Wheel Quest — App Store Screenshots</h1>
    <nav>${nav}</nav>
  </header>
  <main>${sections.join('\n')}</main>
</body>
</html>`;

  fs.writeFileSync(OUT_FILE, html, 'utf8');
  return OUT_FILE;
}

function openInChrome(filePath) {
  const url = `file://${filePath}`;
  try {
    execSync(`open -a "Google Chrome" "${filePath}"`, { stdio: 'ignore' });
  } catch {
    execSync(`open "${filePath}"`, { stdio: 'ignore' });
  }
  console.log(`Opened ${url}`);
}

const out = buildGallery();
console.log(`Gallery written: ${out}`);
openInChrome(out);
