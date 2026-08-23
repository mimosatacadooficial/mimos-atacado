// This module talks to MonsterPay using the secret key and must only ever
// be imported from server code (server actions / route handlers).
const BASE_URL = "https://api.monsterpay.top/v1"

function getHeaders() {
  const apiKey = process.env.API_KEY
  const secretKey = process.env.API_KEY_2
  if (!apiKey || !secretKey) {
    throw new Error(
      "As credenciais da MonsterPay (API_KEY / API_KEY_2) não estão configuradas."
    )
  }
  return {
    "x-api-key": apiKey,
    "x-secret-key": secretKey,
    "Content-Type": "application/json",
  }
}

export type MonsterPayUtms = {
  utmSource?: string | null
  utmCampaign?: string | null
  utmMedium?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  src?: string | null
  sck?: string | null
}

export type CreatePixPaymentInput = MonsterPayUtms & {
  amountCents: number
  customerName: string
  customerEmail: string
  customerDocument?: string
  customerPhone?: string
  description?: string
  sourceUrl?: string
  userAgent?: string
}

export type CreatePixPaymentResult =
  | {
      success: true
      id: string
      status: string
      pixCode: string
      amount: number
      expiresAt: string | null
    }
  | { success: false; error: string }

export type PaymentStatusResult =
  | {
      success: true
      id: string
      status: "pending" | "paid" | "expired" | "refunded" | string
      amount: number
    }
  | { success: false; error: string }

/**
 * Creates a PIX charge on MonsterPay and returns the copy-and-paste code
 * used to render the QR code and payment string.
 */
export async function createPixPayment(
  input: CreatePixPaymentInput
): Promise<CreatePixPaymentResult> {
  try {
    const body: Record<string, unknown> = {
      amount: Number((input.amountCents / 100).toFixed(2)),
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_document: input.customerDocument,
      customer_phone: input.customerPhone,
      description: input.description,
      source_url: input.sourceUrl,
      user_agent: input.userAgent,
      utm_source: input.utmSource || undefined,
      utm_campaign: input.utmCampaign || undefined,
      utm_medium: input.utmMedium || undefined,
      utm_content: input.utmContent || undefined,
      utm_term: input.utmTerm || undefined,
      src: input.src || undefined,
      sck: input.sck || undefined,
    }

    const res = await fetch(`${BASE_URL}/create-payment`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)

    if (!res.ok || !data) {
      const message =
        data?.message || data?.error || `Falha ao criar pagamento PIX (HTTP ${res.status}).`
      return { success: false, error: message }
    }

    if (!data.pix_code) {
      return { success: false, error: "A MonsterPay não retornou o código PIX." }
    }

    return {
      success: true,
      id: data.id,
      status: data.status,
      pixCode: data.pix_code,
      amount: data.amount,
      expiresAt: data.expires_at ?? null,
    }
  } catch (error) {
    console.error("[v0] MonsterPay createPixPayment error:", error)
    return { success: false, error: "Não foi possível conectar ao provedor de pagamentos." }
  }
}

/**
 * Polls MonsterPay for the current status of a previously created PIX charge.
 */
export async function getPixPaymentStatus(id: string): Promise<PaymentStatusResult> {
  try {
    const res = await fetch(`${BASE_URL}/payment-status/${id}`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)

    if (!res.ok || !data) {
      const message =
        data?.message || data?.error || `Falha ao consultar pagamento (HTTP ${res.status}).`
      return { success: false, error: message }
    }

    return { success: true, id: data.id, status: data.status, amount: data.amount }
  } catch (error) {
    console.error("[v0] MonsterPay getPixPaymentStatus error:", error)
    return { success: false, error: "Não foi possível conectar ao provedor de pagamentos." }
  }
}
