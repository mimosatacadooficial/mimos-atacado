"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, X, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"

const POPULAR_SEARCHES = [
  "Kit de Maquiagem",
  "Pincéis",
  "Esponjas",
  "Batom",
  "Sérum Vitamina C",
  "Perfumaria",
  "Protetor Solar",
]

export function SearchPageInput({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter()
  const [value, setValue] = React.useState(initialQuery)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setValue(initialQuery)
  }, [initialQuery])

  function handleSearch(term: string) {
    const trimmed = term.trim()
    setValue(term)
    if (trimmed) {
      router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/buscar")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSearch(value)
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="relative flex w-full max-w-2xl items-center">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="O que você está procurando no atacado?"
          className="h-12 w-full rounded-2xl bg-card pl-4 pr-24 text-base border-border/80 shadow-xs focus-visible:ring-primary/40"
          autoFocus={!initialQuery}
          aria-label="Buscar produtos no atacado"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("")
                inputRef.current?.focus()
              }}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Limpar campo"
            >
              <X className="size-4" />
            </button>
          )}

          <button
            type="submit"
            className="flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
            aria-label="Buscar"
          >
            <Search className="size-3.5" />
            <span>Buscar</span>
          </button>
        </div>
      </form>

      {/* Popular Suggestions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3 text-primary" /> Sugestões:
        </span>
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleSearch(term)}
            className="rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-primary active:scale-95"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  )
}
