"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatCentsToBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteProductButton } from "@/components/admin/delete-product-button"
import { Plus, Pencil, Search, Package } from "lucide-react"

export interface AdminProductRow {
  id: number
  name: string
  slug: string
  basePriceCents: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  categoryName: string | null
  images: string[]
  categoryNames: string[]
}

interface ProductsTableViewProps {
  initialProducts: AdminProductRow[]
}

export function ProductsTableView({ initialProducts }: ProductsTableViewProps) {
  const [search, setSearch] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"todos" | "ativos" | "destaques">("todos")

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryNames.some((cat) => cat.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus =
        selectedFilter === "todos" ||
        (selectedFilter === "ativos" && p.isActive) ||
        (selectedFilter === "destaques" && p.isFeatured)

      return matchesSearch && matchesStatus
    })
  }, [initialProducts, search, selectedFilter])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {initialProducts.length} produtos cadastrados no catálogo para revenda.
          </p>
        </div>
        <Button render={<Link href="/admin/produtos/novo" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          Novo produto
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setSelectedFilter("todos")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              selectedFilter === "todos"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({initialProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("ativos")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              selectedFilter === "ativos"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ativos ({initialProducts.filter((p) => p.isActive).length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("destaques")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              selectedFilter === "destaques"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Destaques ({initialProducts.filter((p) => p.isFeatured).length})
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
          <Package className="size-8 text-muted-foreground mb-2" />
          <p className="font-semibold text-foreground">Nenhum produto encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Tente ajustar o termo da busca ou filtro.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço base</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/50">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground text-sm">{product.name}</span>
                        <span className="text-[11px] text-muted-foreground">ID: #{product.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex flex-wrap gap-1">
                      {product.categoryNames.map((name) => (
                        <Badge key={name} variant="outline" className="font-normal text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {formatCentsToBRL(product.basePriceCents)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{product.stock} un.</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={product.isActive ? "secondary" : "outline"} className="text-xs">
                        {product.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      {product.isFeatured && (
                        <Badge variant="default" className="text-xs">
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        render={<Link href={`/admin/produtos/${product.id}`} />}
                        nativeButton={false}
                        title="Editar produto"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
