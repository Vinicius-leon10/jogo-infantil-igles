// The test site lives on the same domain as the real one (…/teste/), so its
// data gets its own prefix: testing never touches the real child's progress.
const PREFIX = __APP_ENV__ === "teste" ? "teste:" : "";

export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}
