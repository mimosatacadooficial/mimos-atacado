"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, X, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatCentsToBRL } from "@/lib/format"
import { cn } from "@/lib/utils"

export type SearchResultItem = {
  id: number
  name: string
  slug: string
  basePriceCents: number
  compareAtPriceCents: number | null
  image: string
  minQuantity: number
  categoryName: string
}

export function HeaderSearch({
  isMobileModal = false,
  onCloseMobile,
}: {
  isMobileModal?: boolean
  onCloseMobile?: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResultItem[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when mobile modal opens
  React.useEffect(() => {
    if (isMobileModal) {
      inputRef.current?.focus()
    }
  }, [isMobileModal])

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search
  React.useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setTotalCount(0)
      setLoading(false)
      setIsOpen(false)
      return
    }

    setLoading(true)
    setIsOpen(true)
    setSelectedIndex(-1)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
          setTotalCount(data.count || 0)
        }
      } catch (err) {
        console.error("Search fetch error:", err)
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (selectedIndex >= 0 && results[selectedIndex]) {
      navigateToProduct(results[selectedIndex].slug)
      return
    }

    setIsOpen(false)
    if (onCloseMobile) onCloseMobile()
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  function navigateToProduct(slug: string) {
    setIsOpen(false)
    if (onCloseMobile) onCloseMobile()
    router.push(`/produto/${slug}`)
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", !isMobileModal && "max-w-xl")}>
      <form onSubmit={handleSubmit} className="relative flex w-full items-center">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar maquiagens, kits, atacado..."
          className="h-11 w-full rounded-full bg-secondary/60 pl-4 pr-20 text-sm border-transparent focus-visible:bg-card focus-visible:ring-primary/40 shadow-xs transition-all"
          aria-label="Buscar produtos"
          autoComplete="off"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground mr-1" />}

          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setResults([])
                setIsOpen(false)
                inputRef.current?.focus()
              }}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-transform active:scale-95 hover:opacity-90"
            aria-label="Buscar"
          >
            <Search className="size-4" />
          </button>
        </div>
      </form>

      {/* Instant Dropdown Preview */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[80vh] overflow-y-auto rounded-2xl border border-border/80 bg-background/98 p-2 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Buscando produtos no atacado...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span>Resultados sugeridos ({totalCount})</span>
                <span className="text-[11px] text-primary">Use ↑↓ para navegar</span>
              </div>

              {results.map((product, idx) => {
                const isSelected = idx === selectedIndex
                return (
                  <div
                    key={product.id}
                    onClick={() => navigateToProduct(product.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors",
                      isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                    )}
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-secondary/50">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>

                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="truncate text-sm font-medium text-foreground">
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-primary font-semibold">
                          {formatCentsToBRL(product.basePriceCents)}
                        </span>
                        <span>•</span>
                        <span>Mín. {product.minQuantity} un</span>
                      </div>
                    </div>

                    <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-60" />
                  </div>
                )
              })}

              <div className="border-t border-border/50 pt-1.5 mt-1">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Sparkles className="size-3.5" />
                  Ver todos os {totalCount} resultados para &quot;{query}&quot;
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm">
              <p className="font-medium text-foreground">Nenhum produto encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tente buscar por termos como &quot;kit&quot;, &quot;batom&quot;, &quot;pincel&quot; ou &quot;esponja&quot;.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
