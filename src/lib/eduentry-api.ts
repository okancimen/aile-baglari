/** Public eduentry-api base URL (CORS EDUENTRY_API ile aynı kök). */
export function getEduentryApiBase(): string {
  const raw = import.meta.env.VITE_EDUENTRY_API_URL;
  const base = typeof raw === "string" ? raw.trim().replace(/\/$/, "") : "";
  if (!base) {
    throw new Error("VITE_EDUENTRY_API_URL tanımlı değil. .env içine public API kökünü ekleyin (örn. https://api.eduentry.ai).");
  }
  return base;
}
