import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Pedido confirmado | Mimos Atacado",
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero } = await searchParams

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="glow flex size-20 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-10 text-primary" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-semibold text-balance sm:text-3xl">
        Pedido recebido com sucesso!
      </h1>
      {numero && (
        <p className="mt-2 text-sm text-muted-foreground">
          Número do pedido: <span className="font-medium text-foreground">{numero}</span>
        </p>
      )}
      <p className="mt-4 text-pretty text-muted-foreground">
        Em breve enviaremos as instruções de pagamento por email e WhatsApp. Guarde o número do seu
        pedido para acompanhamento.
      </p>
      <Button
        render={<Link href="/produtos" />}
        nativeButton={false}
        size="lg"
        className="mt-8 glow-sm"
      >
        Continuar comprando
      </Button>
    </div>
  )
}
