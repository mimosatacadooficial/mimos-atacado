"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, Search, ShoppingBag, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"

type Category = { name: string; slug: string }

export function SiteHeader({ categories }: { categories: Category[] }) {
  const { itemCount } = useCart()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
      setMobileOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Promo bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:text-sm">
          <Zap className="size-3.5 shrink-0 fill-current" />
          <span>
            Pague com PIX e <span className="font-semibold">ganhe desconto</span>
          </span>
        </div>
      </div>

      <div className="border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-heading text-xl">Categorias</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categoria/${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {c.name}
                  </Link>
                ))}
                <Link
                  href="/produtos"
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 flex items-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <Sparkles className="size-4" />
                  Ofertas
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground glow-sm">
              <Sparkles className="size-5" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground md:text-xl">
              Mimos Atacado
            </span>
          </Link>

          <form onSubmit={handleSearch} className="relative ml-2 hidden flex-1 max-w-xl md:flex">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="h-11 rounded-full bg-secondary/60 pr-11 border-transparent focus-visible:bg-card"
              aria-label="Buscar produtos"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
              aria-label="Buscar"
            >
              <Search className="size-4" />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              render={<Link href="/buscar" aria-label="Buscar produtos" />}
              nativeButton={false}
            >
              <Search />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              render={<Link href="/carrinho" aria-label={`Carrinho, ${itemCount} itens`} />}
              nativeButton={false}
            >
              <ShoppingBag />
              {itemCount > 0 && (
                <span
                  className={cn(
                    "absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
                  )}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <nav className="hidden bg-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2.5">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="text-sm font-medium text-background/70 transition-colors hover:text-background"
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/produtos"
            className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 glow-sm"
          >
            <Sparkles className="size-3.5" />
            Ofertas
          </Link>
        </div>
      </nav>
    </header>
  )
}
