"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginAdmin } from "@/app/actions/admin-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Sparkles, Eye, EyeOff } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await loginAdmin(password)
    if (result.success) {
      router.push("/admin")
      router.refresh()
    } else {
      setError(result.error ?? "Senha incorreta.")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary glow-sm">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Painel Mimos Atacado</h1>
          <p className="text-sm text-muted-foreground">Entre com a senha de administrador para continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  autoFocus
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-1"
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
            </Field>
          </FieldGroup>
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  )
}
