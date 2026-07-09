/** Montreal calendar-day helpers (America/Montreal) — matches puzzle-app + backend. */

const MONTREAL_TZ = 'America/Montreal';

export function montrealYmdFromDate(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: MONTREAL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

function montrealDayStartUtcMs(ymd) {
  const [Y, M, D] = ymd.split('-').map(Number);
  let lo = Date.UTC(Y, M - 1, D, 0, 0, 0) - 14 * 3600000;
  let hi = Date.UTC(Y, M - 1, D, 0, 0, 0) + 14 * 3600000;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (montrealYmdFromDate(new Date(mid)) < ymd) lo = mid;
    else hi = mid;
  }
  return hi;
}

export function addMontrealCalendarDays(ymd, deltaDays) {
  if (deltaDays === 0) return ymd;
  let d = ymd;
  const step = deltaDays > 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(deltaDays); i += 1) {
    const noon = montrealDayStartUtcMs(d) + 12 * 3600000;
    d = montrealYmdFromDate(new Date(noon + step * 86400000));
  }
  return d;
}

export function formatDisplayDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function clampYmd(ymd, minYmd, maxYmd) {
  if (ymd < minYmd) return minYmd;
  if (ymd > maxYmd) return maxYmd;
  return ymd;
}
