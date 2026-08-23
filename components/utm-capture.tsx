"use client"

import { useEffect } from "react"
import { captureUtmsFromLocation } from "@/lib/utm"

/**
 * Silently captures utm_source/utm_campaign/utm_medium/utm_content/utm_term/
 * src/sck from the current URL on every navigation and stores them for the
 * session, so the checkout can forward them to the MonsterPay PIX charge.
 */
export function UtmCapture() {
  useEffect(() => {
    captureUtmsFromLocation()
  }, [])

  return null
}
