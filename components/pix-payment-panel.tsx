"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, Copy, Loader2, TimerReset, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { checkOrderPaymentStatus } from "@/app/actions/payment-status"
import { formatCentsToBRL } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatTimeLeft(ms: number) {
  if (ms <= 0) return "00:00"
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }
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
    <div className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm">
      {/* Status + Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Loader2 className="size-3.5 animate-spin" />
          Aguardando pagamento
        </span>
        {timeLeft !== null && timeLeft > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <TimerReset className="size-3.5 text-amber-500" />
            Expira em <strong className="font-medium text-foreground">{formatTimeLeft(timeLeft)}</strong>
          </span>
        )}
      </div>

      {/* Valor + Pedido */}
      <div className="flex flex-col items-center text-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Valor a pagar
        </span>
        <p className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {formatCentsToBRL(totalCents)}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">Pedido {orderNumber}</p>
      </div>

      {/* PIX COPIA E COLA - POSICIONADO ACIMA DO QR CODE PARA FICAR VISÍVEL IMEDIATAMENTE NO MOBILE SEM ROLAR */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Pix Copia e Cola
          </span>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Aprovação instantânea
          </span>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleCopy}
          className={cn(
            "w-full h-12 text-base font-semibold gap-2 shadow-sm transition-all active:scale-[0.99]",
            copied
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90 glow-sm"
          )}
        >
          {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
          {copied ? "Código PIX copiado!" : "Copiar código PIX"}
        </Button>

        <div
          onClick={handleCopy}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleCopy()}
          title="Clique para copiar"
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <code className="flex-1 truncate font-mono text-xs text-muted-foreground select-all">
            {pixCode}
          </code>
          <span className="shrink-0 text-xs font-semibold text-primary">
            {copied ? "Copiado!" : "Copiar"}
          </span>
        </div>
      </div>

      {/* QR Code Divider & Container */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="h-px w-10 bg-border" />
          <span>Ou pague escaneando o QR Code</span>
          <span className="h-px w-10 bg-border" />
        </div>

        <div className="rounded-xl border border-border/80 bg-background p-2.5 shadow-xs">
          <Image
            src={qrDataUrl || "/placeholder.svg"}
            alt="QR Code para pagamento via PIX"
            width={180}
            height={180}
            className="size-[160px] sm:size-[190px]"
            unoptimized
          />
        </div>
      </div>

      {/* Instruções */}
      <div className="rounded-xl bg-muted/40 p-3.5 sm:p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1.5">Como pagar com o código PIX:</p>
        <ol className="flex flex-col gap-1 list-decimal list-inside">
          <li>Clique no botão <strong>Copiar código PIX</strong> acima.</li>
          <li>Abra o aplicativo do seu banco e acesse a área <strong>Pix Copia e Cola</strong>.</li>
          <li>Cole o código e confirme o pagamento. Esta página atualiza automaticamente.</li>
        </ol>
      </div>
    </div>
  )
}
