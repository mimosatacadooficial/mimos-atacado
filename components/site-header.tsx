"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, Search, ShoppingBag, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"

import { HeaderSearch } from "@/components/header-search"

type Category = { name: string; slug: string }

export function SiteHeader({ categories }: { categories: Category[] }) {
  const { itemCount } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

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
              <div className="px-4 py-2">
                <HeaderSearch isMobileModal onCloseMobile={() => setMobileOpen(false)} />
              </div>
              <nav className="flex flex-col gap-1 px-4">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Início
                </Link>
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

          <Link
            href="/"
            className="flex flex-1 items-center justify-center md:flex-initial md:justify-start"
            aria-label="Mimo Atacado"
          >
            <Image
              src="/images/logo-mimo-atacado-transparent.png"
              alt="Mimo Atacado"
              width={160}
              height={112}
              priority
              className="h-12 w-auto md:h-14"
            />
          </Link>

          {/* Desktop Instant Live Search */}
          <div className="relative ml-2 hidden flex-1 max-w-xl md:flex">
            <HeaderSearch />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label="Buscar produtos"
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

        {/* Mobile Quick Search Bar (Toggled) */}
        {mobileSearchOpen && (
          <div className="border-t border-border/50 bg-background/98 px-4 py-2.5 md:hidden animate-in slide-in-from-top-2 duration-150">
            <HeaderSearch isMobileModal onCloseMobile={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </div>

      <nav className="hidden bg-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2.5">
          <Link href="/" className="text-sm font-medium text-background/70 transition-colors hover:text-background">
            Início
          </Link>
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
