// Browser storage can be blocked (private browsing, disabled site data) or full.
// Reads then behave as if nothing was saved and writes are skipped, so the app
// keeps working for the current visit.

export function readStored(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* Keep going without saving. */ }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch { /* Nothing was saved. */ }
}
