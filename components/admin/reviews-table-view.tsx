"use client"

import { useState } from "react"
import {
  Star,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/reviews/star-rating"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  adminToggleApprovalAction,
  adminDeleteReviewAction,
  adminCreateReviewAction,
} from "@/app/actions/reviews"
import type { ProductReview } from "@/lib/reviews/types"

interface ProductOption {
  id: number
  name: string
  slug: string
}

interface ReviewsTableViewProps {
  initialReviews: ProductReview[]
  products: ProductOption[]
}

export function ReviewsTableView({ initialReviews, products }: ReviewsTableViewProps) {
  const [reviewsList, setReviewsList] = useState<ProductReview[]>(initialReviews)
  const [search, setSearch] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal new review
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id.toString() || "1"
  )
  const [authorName, setAuthorName] = useState("")
  const [authorLocation, setAuthorLocation] = useState("")
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")

  const filtered = reviewsList.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch =
      r.authorName.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      (r.authorLocation && r.authorLocation.toLowerCase().includes(q))

    const matchesRating =
      ratingFilter === "all" || Math.round(r.rating) === Number(ratingFilter)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && r.isApproved) ||
      (statusFilter === "hidden" && !r.isApproved)

    return matchesSearch && matchesRating && matchesStatus
  })

  const totalReviews = reviewsList.length
  const approvedReviews = reviewsList.filter((r) => r.isApproved).length
  const averageRating =
    totalReviews > 0
      ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : "5.0"
  const fiveStarsCount = reviewsList.filter((r) => Math.round(r.rating) === 5).length

  const handleToggleApproval = async (id: string, slug: string) => {
    try {
      const res = await adminToggleApprovalAction(id, slug)
      if (res.success && res.updated) {
        setReviewsList((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
        )
        toast.success(
          res.updated.isApproved
            ? "Avaliação aprovada e visível na loja!"
            : "Avaliação ocultada da loja."
        )
      }
    } catch {
      toast.error("Erro ao alterar visibilidade.")
    }
  }

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta avaliação?")) return

    try {
      const res = await adminDeleteReviewAction(id, slug)
      if (res.success) {
        setReviewsList((prev) => prev.filter((r) => r.id !== id))
        toast.success("Avaliação excluída com sucesso.")
      }
    } catch {
      toast.error("Erro ao excluir avaliação.")
    }
  }

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedProd = products.find((p) => p.id.toString() === selectedProductId)
    if (!selectedProd) return

    setIsCreating(true)
    try {
      const res = await adminCreateReviewAction({
        productId: selectedProd.id,
        productSlug: selectedProd.slug,
        productName: selectedProd.name,
        authorName,
        authorLocation: authorLocation || "Revendedor(a) Verificado(a)",
        rating,
        title,
        comment,
      })

      if (res.success && res.review) {
        setReviewsList((prev) => [res.review!, ...prev])
        toast.success("Avaliação cadastrada com sucesso!")
        setDialogOpen(false)
        setAuthorName("")
        setAuthorLocation("")
        setTitle("")
        setComment("")
        setRating(5)
      } else {
        toast.error(res.error || "Erro ao cadastrar avaliação.")
      }
    } catch {
      toast.error("Erro inesperado.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Avaliações de Clientes & Depoimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as avaliações dos produtos, adicione depoimentos de clientes do WhatsApp e aumente a conversão no Google.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Adicionar Avaliação Manual
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="size-5 fill-amber-400 text-amber-400" />
                Cadastrar Depoimento / Avaliação
              </DialogTitle>
              <DialogDescription>
                Adicione depoimentos recebidos pelo WhatsApp, direct ou e-mail para fortalecer a prova social.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateReview} className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Produto</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => {
                    if (val) setSelectedProductId(val)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-center justify-center gap-1 rounded-lg border bg-secondary/30 p-2.5">
                <span className="text-xs text-muted-foreground">Nota do cliente:</span>
                <StarRating value={rating} interactive size="lg" onChange={setRating} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="author" className="text-xs">Nome do Cliente *</Label>
                  <Input
                    id="author"
                    placeholder="Ex: Beatriz Lima (Lojista)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="loc" className="text-xs">Cidade/Estado</Label>
                  <Input
                    id="loc"
                    placeholder="Ex: Goiânia - GO"
                    value={authorLocation}
                    onChange={(e) => setAuthorLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t" className="text-xs">Título *</Label>
                <Input
                  id="t"
                  placeholder="Ex: Giro rápido e clientes super satisfeitas!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c" className="text-xs">Comentário / Depoimento *</Label>
                <Textarea
                  id="c"
                  rows={3}
                  placeholder="O que o cliente disse sobre a qualidade, embalagem e vendas..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Salvando..." : "Salvar Avaliação"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total de Avaliações</span>
            <MessageSquare className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{totalReviews}</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Média Geral da Loja</span>
            <Star className="size-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{averageRating}</span>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Avaliações 5 Estrelas</span>
            <Sparkles className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{fiveStarsCount}</div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Visíveis na Loja</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {approvedReviews} / {totalReviews}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, produto ou texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={ratingFilter}
            onValueChange={(val) => {
              if (val) setRatingFilter(val)
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Estrelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as notas</SelectItem>
              <SelectItem value="5">5 estrelas</SelectItem>
              <SelectItem value="4">4 estrelas</SelectItem>
              <SelectItem value="3">3 estrelas</SelectItem>
              <SelectItem value="2">2 estrelas</SelectItem>
              <SelectItem value="1">1 estrela</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="approved">Aprovadas</SelectItem>
              <SelectItem value="hidden">Ocultas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-card">
            <Star className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhuma avaliação encontrada.</p>
          </div>
        ) : (
          filtered.map((review) => (
            <div
              key={review.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 transition-all bg-card ${
                review.isApproved ? "border-border/60" : "border-amber-500/30 bg-amber-500/5 opacity-75"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} size="sm" />
                  <span className="text-xs font-semibold text-foreground">{review.title}</span>
                  <Badge variant={review.isApproved ? "outline" : "secondary"} className="text-[10px]">
                    {review.isApproved ? "Visível" : "Oculta"}
                  </Badge>
                  {review.isVerifiedPurchase && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                      Compra Verificada
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleApproval(review.id, review.productSlug)}
                    title={review.isApproved ? "Ocultar da loja" : "Aprovar para a loja"}
                  >
                    {review.isApproved ? (
                      <>
                        <EyeOff className="size-3.5" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" />
                        Aprovar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(review.id, review.productSlug)}
                    title="Excluir avaliação"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                "{review.comment}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{review.authorName}</span>
                  {review.authorLocation && <span>• {review.authorLocation}</span>}
                  <span>• {new Date(review.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>

                <div className="flex items-center gap-3">
                  {review.helpfulCount > 0 && (
                    <span className="flex items-center gap-1 text-primary">
                      <ThumbsUp className="size-3" />
                      {review.helpfulCount} votos úteis
                    </span>
                  )}

                  <Link
                    href={`/produto/${review.productSlug}`}
                    target="_blank"
                    className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                  >
                    <span>{review.productName}</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
