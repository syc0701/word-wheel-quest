/**
 * Legal pages on puzzleinteract.com match hash exactly (`#terms`, `#privacy`).
 * In-app links use `#terms?platform=app`; rewrite to `?platform=app#terms` for WebView.
 */
export function normalizeLegalWebViewUrl(url) {
  if (!url || typeof url !== 'string') return url;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('puzzleinteract.com')) return url;

    const rawHash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    const queryIndex = rawHash.indexOf('?');
    if (queryIndex < 0) return url;

    const section = rawHash.slice(0, queryIndex);
    const hashQuery = rawHash.slice(queryIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);

    hashParams.forEach((value, key) => {
      if (!parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, value);
      }
    });

    parsed.hash = section ? `#${section}` : '';
    return parsed.toString();
  } catch {
    return url;
  }
}
