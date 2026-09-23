import Link from "next/link"
import { Search, Home, ShoppingBag, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Sparkles className="size-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-primary">Erro 404</span>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Página ou produto não encontrado
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        O link que você acessou pode ter mudado ou o produto foi atualizado. Não se preocupe! Confira nossos kits e categorias mais vendidos para revenda:
      </p>

      {/* Quick Search */}
      <form action="/buscar" method="GET" className="mt-6 flex w-full max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            placeholder="Buscar kit de maquiagem, batons, bases..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {/* Quick Links */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/categoria/maquiagem"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          💄 Maquiagem no Atacado
        </Link>
        <Link
          href="/produto/kit-de-maquiagem-38-itens-com-acessorios-extras-para-revender"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          ✨ Kit de Maquiagem 38 itens
        </Link>
        <Link
          href="/produtos"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          📦 Ver todos os produtos
        </Link>
      </div>

      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="size-4" />
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  )
}
