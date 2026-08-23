import type { Metadata } from "next"
import { CheckoutForm } from "@/components/checkout-form"

export const metadata: Metadata = {
  title: "Finalizar compra | Mimos Atacado",
  description: "Finalize sua compra no atacado com entrega para todo o Brasil.",
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-heading text-2xl font-semibold text-balance sm:text-3xl">
        Finalizar compra
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Preencha seus dados para calcular a entrega e concluir o pedido.
      </p>
      <CheckoutForm />
    </div>
  )
}
