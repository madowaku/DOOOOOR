const KEY = 'dooooor.v1';
export function readSave(count) {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY)) ?? {};
    return {
      cleared: Array.isArray(raw.cleared) ? [...new Set(raw.cleared.filter(n => Number.isInteger(n) && n >= 0 && n < count))] : [],
      muted: raw.muted === true,
      reduced: typeof raw.reduced === 'boolean' ? raw.reduced : matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  } catch { return { cleared: [], muted: false, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }; }
}
export function writeSave(save) { try { localStorage.setItem(KEY, JSON.stringify(save)); return true; } catch { return false; } }
