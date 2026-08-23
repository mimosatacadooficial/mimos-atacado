"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { createOrder } from "@/app/actions/orders"
import { getStoredUtms } from "@/lib/utm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { formatCentsToBRL } from "@/lib/format"

type FormState = {
  name: string
  email: string
  phone: string
  cpf: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean)
  let result = parts.join(".")
  if (digits.length > 9) result += `-${digits.slice(9)}`
  return result
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function CheckoutForm() {
  const { items, subtotalCents, clearCart } = useCart()
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [cepLoading, setCepLoading] = useState(false)
  const [cepNotFound, setCepNotFound] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const numberInputRef = useRef<HTMLInputElement>(null)
  const lastLookedUpCep = useRef<string>("")

  const shippingCents = subtotalCents >= 30000 ? 0 : 1990
  const totalCents = subtotalCents + shippingCents

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function lookupCep(digits: string) {
    if (digits.length !== 8 || digits === lastLookedUpCep.current) return
    lastLookedUpCep.current = digits
    setCepLoading(true)
    setCepNotFound(false)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepNotFound(true)
        return
      }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }))
      setErrors((prev) => ({ ...prev, street: undefined, city: undefined, state: undefined }))
      // Move focus to "Número" since the address was just auto-filled.
      numberInputRef.current?.focus()
    } catch {
      // Network error - the user can still fill the address in manually.
    } finally {
      setCepLoading(false)
    }
  }

  function handleCepChange(value: string) {
    const formatted = formatCep(value)
    update("cep", formatted)
    setCepNotFound(false)
    const digits = formatted.replace(/\D/g, "")
    if (digits.length === 8) {
      lookupCep(digits)
    } else {
      lastLookedUpCep.current = ""
    }
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = "Informe seu nome completo."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Informe um email válido."
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone válido com DDD."
    if (form.cpf.replace(/\D/g, "").length !== 11) next.cpf = "Informe um CPF válido."
    if (form.cep.replace(/\D/g, "").length !== 8) next.cep = "Informe um CEP válido."
    if (!form.street.trim()) next.street = "Informe o endereço."
    if (!form.number.trim()) next.number = "Informe o número."
    if (!form.city.trim()) next.city = "Informe a cidade."
    if (!form.state.trim()) next.state = "Informe o estado."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!items.length) {
      setSubmitError("Seu carrinho está vazio.")
      return
    }
    if (!validate()) return

    startTransition(async () => {
      // Personal data (name, email, phone, CPF, address) is used only for this
      // request to generate the PIX charge with MonsterPay - it is never
      // persisted to our database. Only anonymous order/product data is saved
      // for admin metrics.
      const result = await createOrder(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        { state: form.state, city: form.city },
        { name: form.name, email: form.email, phone: form.phone, document: form.cpf },
        getStoredUtms(),
        window.location.href
      )
      if (result.success) {
        clearCart()
        router.push(`/pagamento?numero=${result.orderNumber}`)
      } else {
        setSubmitError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Dados de contato</FieldLegend>
        <FieldDescription>
          Usados apenas para processar seu pagamento e entrega. Não armazenamos esses dados.
        </FieldDescription>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nome completo</FieldLabel>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={!!errors.name}
              autoComplete="name"
            />
            <FieldError>{errors.name}</FieldError>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={!!errors.email}
                autoComplete="email"
              />
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">Telefone / WhatsApp</FieldLabel>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", formatPhone(e.target.value))}
                aria-invalid={!!errors.phone}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
              <FieldError>{errors.phone}</FieldError>
            </Field>
          </div>
          <Field data-invalid={!!errors.cpf} className="sm:max-w-xs">
            <FieldLabel htmlFor="cpf">CPF</FieldLabel>
            <Input
              id="cpf"
              value={form.cpf}
              onChange={(e) => update("cpf", formatCpf(e.target.value))}
              aria-invalid={!!errors.cpf}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            <FieldError>{errors.cpf}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Endereço de entrega</FieldLegend>
        <FieldGroup>
          <Field data-invalid={!!errors.cep || cepNotFound} className="sm:max-w-xs">
            <FieldLabel htmlFor="cep">CEP</FieldLabel>
            <Input
              id="cep"
              value={form.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              aria-invalid={!!errors.cep || cepNotFound}
              placeholder="00000-000"
              inputMode="numeric"
              autoComplete="postal-code"
            />
            <FieldDescription>
              {cepLoading
                ? "Buscando endereço..."
                : cepNotFound
                  ? "CEP não encontrado. Preencha o endereço manualmente."
                  : "Digite o CEP e preenchemos o endereço automaticamente."}
            </FieldDescription>
            <FieldError>{errors.cep}</FieldError>
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field data-invalid={!!errors.street}>
              <FieldLabel htmlFor="street">Endereço</FieldLabel>
              <Input
                id="street"
                value={form.street}
                onChange={(e) => update("street", e.target.value)}
                aria-invalid={!!errors.street}
              />
              <FieldError>{errors.street}</FieldError>
            </Field>
            <Field data-invalid={!!errors.number}>
              <FieldLabel htmlFor="number">Número</FieldLabel>
              <Input
                id="number"
                ref={numberInputRef}
                value={form.number}
                onChange={(e) => update("number", e.target.value)}
                aria-invalid={!!errors.number}
              />
              <FieldError>{errors.number}</FieldError>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="complement">Complemento (opcional)</FieldLabel>
              <Input
                id="complement"
                value={form.complement}
                onChange={(e) => update("complement", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="neighborhood">Bairro</FieldLabel>
              <Input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field data-invalid={!!errors.city}>
              <FieldLabel htmlFor="city">Cidade</FieldLabel>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                aria-invalid={!!errors.city}
              />
              <FieldError>{errors.city}</FieldError>
            </Field>
            <Field data-invalid={!!errors.state}>
              <FieldLabel htmlFor="state">UF</FieldLabel>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => update("state", e.target.value.toUpperCase().slice(0, 2))}
                aria-invalid={!!errors.state}
              />
              <FieldError>{errors.state}</FieldError>
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      {submitError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCentsToBRL(subtotalCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Frete</span>
          <span>{shippingCents === 0 ? "Grátis" : formatCentsToBRL(shippingCents)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCentsToBRL(totalCents)}</span>
        </div>
      </div>

      <Button type="submit" size="lg" className="glow-sm" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" data-icon="inline-start" />
            Gerando pagamento PIX...
          </>
        ) : (
          "Gerar pagamento PIX"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Você receberá um código PIX para pagamento imediato. Seus dados pessoais não são armazenados em
        nosso banco de dados.
      </p>
    </form>
  )
}
