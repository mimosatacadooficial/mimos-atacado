import crypto from "crypto"

// Configuração oficial do SelectusPay
const BASE_URL = "https://www.selectuspay.com.br/api/v1"

const DEFAULT_API_KEY =
  process.env.SELECTUSPAY_API_KEY ||
  process.env.API_KEY ||
  "mp_live_bf01acb00eafbe978258b80b104d07fb2ecfdb111978bc22"

const DEFAULT_SECRET_KEY =
  process.env.SELECTUSPAY_SECRET_KEY ||
  process.env.API_KEY_2 ||
  "bc99e2c1-b2de-4097-983c-80623ce55109"

function getHeaders() {
  const apiKey = DEFAULT_API_KEY
  if (!apiKey) {
    throw new Error("A API Key da SelectusPay não está configurada.")
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }
}

export type SelectusPayUtms = {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  placement?: string | null
  fbc?: string | null
  fbp?: string | null
  ttclid?: string | null
  src?: string | null
  sck?: string | null
}

export type SelectusPayItem = {
  title: string
  unitPriceCents: number
  quantity: number
}

export type CreatePixPaymentInput = SelectusPayUtms & {
  amountCents: number
  customerName: string
  customerEmail: string
  customerDocument?: string
  customerPhone?: string
  description?: string
  items: SelectusPayItem[]
}

export type CreatePixPaymentResult =
  | {
      success: true
      id: string
      status: string
      pixCode: string
      qrCodeBase64?: string | null
      amount: number
      expiresAt: string | null
    }
  | { success: false; error: string }

export type PaymentStatusResult =
  | {
      success: true
      id: string
      status: "pending" | "approved" | "expired" | "refunded" | string
      amount: number
    }
  | { success: false; error: string }

/**
 * Cria uma cobrança PIX na SelectusPay e retorna o código copia-e-cola (qr_code)
 * e os dados para exibição do QR Code na tela de pagamento.
 */
export async function createPixPayment(
  input: CreatePixPaymentInput
): Promise<CreatePixPaymentResult> {
  try {
    const documentDigits = input.customerDocument?.replace(/\D/g, "") || ""
    const phoneDigits = input.customerPhone?.replace(/\D/g, "") || ""

    const body: Record<string, unknown> = {
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        document: documentDigits,
        phone: phoneDigits ? (phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`) : undefined,
      },
      payment_method: "pix",
      items: input.items.map((item) => ({
        title: item.title,
        unit_price: item.unitPriceCents,
        quantity: item.quantity,
      })),
      utm_source: input.utmSource || undefined,
      utm_medium: input.utmMedium || undefined,
      utm_campaign: input.utmCampaign || undefined,
      utm_content: input.utmContent || undefined,
      utm_term: input.utmTerm || undefined,
      placement: input.placement || undefined,
      fbc: input.fbc || undefined,
      fbp: input.fbp || undefined,
      ttclid: input.ttclid || undefined,
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
        data?.message ||
        data?.error?.message ||
        (typeof data?.error === "string" ? data.error : null) ||
        `Falha ao criar cobrança PIX na SelectusPay (HTTP ${res.status}).`
      return { success: false, error: message }
    }

    const pixData = data.pix || {}
    const pixCode = pixData.qr_code || ""

    if (!pixCode) {
      return {
        success: false,
        error: "A SelectusPay não retornou o código PIX para este pedido.",
      }
    }

    return {
      success: true,
      id: String(data.id),
      status: data.status || "pending",
      pixCode,
      qrCodeBase64: pixData.qr_code_base64 || null,
      amount: data.amount ?? input.amountCents,
      expiresAt: pixData.expires_at || null,
    }
  } catch (error) {
    console.error("SelectusPay createPixPayment error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro inesperado ao conectar com a SelectusPay.",
    }
  }
}

/**
 * Valida a autenticidade de um webhook recebido da SelectusPay
 * utilizando HMAC-SHA256 e a Secret Key.
 */
export function verifyWebhookSignature(
  rawBody: string | object,
  signature: string | null | undefined
): boolean {
  if (!signature) return false
  const secret = DEFAULT_SECRET_KEY
  if (!secret) return false

  try {
    const payload = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody)
    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")

    return computedHash === signature
  } catch (err) {
    console.error("Erro ao validar assinatura do webhook SelectusPay:", err)
    return false
  }
}
