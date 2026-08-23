export type StoredUtms = {
  utmSource?: string
  utmCampaign?: string
  utmMedium?: string
  utmContent?: string
  utmTerm?: string
  src?: string
  sck?: string
}

const STORAGE_KEY = "mimos-atacado-utms"

const PARAM_MAP: Record<keyof StoredUtms, string> = {
  utmSource: "utm_source",
  utmCampaign: "utm_campaign",
  utmMedium: "utm_medium",
  utmContent: "utm_content",
  utmTerm: "utm_term",
  src: "src",
  sck: "sck",
}

/**
 * Reads UTM/campaign params from the current URL and persists them to
 * sessionStorage so they survive navigation across the site until checkout.
 * Only overwrites stored values when the incoming URL actually carries new
 * UTM params, so internal navigation without UTMs doesn't wipe attribution.
 */
export function captureUtmsFromLocation() {
  if (typeof window === "undefined") return

  const params = new URLSearchParams(window.location.search)
  const incoming: StoredUtms = {}
  let hasAny = false

  for (const [key, param] of Object.entries(PARAM_MAP) as [keyof StoredUtms, string][]) {
    const value = params.get(param)
    if (value) {
      incoming[key] = value
      hasAny = true
    }
  }

  if (!hasAny) return

  try {
    const existingRaw = sessionStorage.getItem(STORAGE_KEY)
    const existing: StoredUtms = existingRaw ? JSON.parse(existingRaw) : {}
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...incoming }))
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function getStoredUtms(): StoredUtms {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
