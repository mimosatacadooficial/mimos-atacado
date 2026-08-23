"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, Copy, Loader2, TimerReset, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { checkOrderPaymentStatus } from "@/app/actions/payment-status"
import { formatCentsToBRL } from "@/lib/format"

function formatTimeLeft(ms: number) {
  if (ms <= 0) return "00:00"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function PixPaymentPanel({
  orderNumber,
  pixCode,
  qrDataUrl,
  totalCents,
  expiresAt,
}: {
  orderNumber: string
  pixCode: string
  qrDataUrl: string
  totalCents: number
  expiresAt: string | null
}) {
  const router = useRouter()
  const [status, setStatus] = useState<"aguardando_pagamento" | "pago" | "expirado" | "erro">(
    "aguardando_pagamento"
  )
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(() =>
    expiresAt ? new Date(expiresAt).getTime() - Date.now() : null
  )
  const pollingRef = useRef(true)

  // Countdown until PIX expiration.
  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => {
      const remaining = new Date(expiresAt).getTime() - Date.now()
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  // Poll MonsterPay (via server action) every 5s until paid/expired.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      const result = await checkOrderPaymentStatus(orderNumber)
      if (!pollingRef.current) return

      if (result.success) {
        if (result.status === "pago") {
          setStatus("pago")
          router.push(`/pedido-confirmado?numero=${orderNumber}`)
          return
        }
        if (result.status === "expirado") {
          setStatus("expirado")
          return
        }
      }

      timeoutId = setTimeout(poll, 5000)
    }

    poll()
    return () => {
      pollingRef.current = false
      clearTimeout(timeoutId)
    }
  }, [orderNumber, router])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      toast.success("Código PIX copiado.")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Não foi possível copiar o código.")
    }
  }

  if (status === "expirado") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center">
        <XCircle className="size-12 text-destructive" />
        <h2 className="font-heading text-xl font-semibold text-foreground">O PIX expirou</h2>
        <p className="text-sm text-muted-foreground">
          O tempo para pagamento do pedido {orderNumber} acabou. Volte ao carrinho para gerar um novo
          pagamento.
        </p>
        <Button render={<a href="/carrinho" />} nativeButton={false} size="lg" className="mt-2">
          Voltar ao carrinho
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Loader2 className="size-3.5 animate-spin" />
          Aguardando pagamento
        </span>
        <p className="text-2xl font-semibold text-foreground">{formatCentsToBRL(totalCents)}</p>
        <p className="text-sm text-muted-foreground">Pedido {orderNumber}</p>
      </div>

      <div className="flex items-center justify-center">
        <div className="rounded-xl border border-border bg-background p-3">
          <Image
            src={qrDataUrl || "/placeholder.svg"}
            alt="QR Code para pagamento via PIX"
            width={220}
            height={220}
            unoptimized
          />
        </div>
      </div>

      {timeLeft !== null && timeLeft > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <TimerReset className="size-4" />
          Expira em <span className="font-medium text-foreground">{formatTimeLeft(timeLeft)}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Ou copie o código Pix Copia e Cola</p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
          <code className="flex-1 truncate text-xs text-muted-foreground">{pixCode}</code>
        </div>
        <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Código copiado" : "Copiar código"}
        </Button>
      </div>

      <ol className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <li>1. Abra o app do seu banco e escolha pagar via PIX.</li>
        <li>2. Escaneie o QR Code ou cole o código copia e cola.</li>
        <li>3. Confirme o pagamento. Esta página atualiza automaticamente.</li>
      </ol>
    </div>
  )
}
