"use client"

import { useState } from "react"
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  CheckCircle2,
  TrendingUp,
  PackageCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { StarRating } from "./star-rating"
import { ReviewFormDialog } from "./review-form-dialog"
import { voteReviewHelpful } from "@/app/actions/reviews"
import type { ProductReview, ProductRatingSummary } from "@/lib/reviews/types"

interface ProductReviewsSectionProps {
  productId: number
  productSlug: string
  productName: string
  reviews: ProductReview[]
  summary: ProductRatingSummary
}

export function ProductReviewsSection({
  productId,
  productSlug,
  productName,
  reviews,
  summary,
}: ProductReviewsSectionProps) {
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null)
  const [votedHelpful, setVotedHelpful] = useState<Record<string, boolean>>({})
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    reviews.forEach((r) => {
      counts[r.id] = r.helpfulCount || 0
    })
    return counts
  })

  const filteredReviews = selectedStarFilter
    ? reviews.filter((r) => Math.round(r.rating) === selectedStarFilter)
    : reviews

  const handleHelpfulClick = async (reviewId: string) => {
    if (votedHelpful[reviewId]) {
      toast.info("Você já considerou esta avaliação útil.")
      return
    }

    setVotedHelpful((prev) => ({ ...prev, [reviewId]: true }))
    setHelpfulCounts((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }))

    try {
      await voteReviewHelpful(reviewId, productSlug)
      toast.success("Obrigado pelo seu voto!")
    } catch {
      // Revert if error
      setVotedHelpful((prev) => ({ ...prev, [reviewId]: false }))
      setHelpfulCounts((prev) => ({
        ...prev,
        [reviewId]: Math.max(0, (prev[reviewId] || 1) - 1),
      }))
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
    } catch {
      return ""
    }
  }

  return (
    <section id="avaliacoes" className="scroll-mt-20 flex flex-col gap-6 pt-10 border-t border-border/60">
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Star className="size-4 fill-amber-500 text-amber-500" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground md:text-2xl">
            Avaliações de Clientes & Revendedores
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Opiniões reais de quem compra no atacado para revenda com lucro em todo o Brasil.
        </p>
      </div>

      {/* Trust Badges Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">100% Compra Verificada</span>
            <span className="text-[11px] text-muted-foreground">Depoimentos auditados de lojistas</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Alta Margem de Lucro</span>
            <span className="text-[11px] text-muted-foreground">Giro rápido comprovado na revenda</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <PackageCheck className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Embalagem Reforçada</span>
            <span className="text-[11px] text-muted-foreground">Produtos chegam 100% protegidos</span>
          </div>
        </div>
      </div>

      {/* Rating Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        {/* Left: Overall Score */}
        <div className="flex flex-col items-center justify-center md:items-start md:border-r md:border-border/60 md:pr-6 md:col-span-4">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-extrabold text-foreground tracking-tight">
              {summary.averageRating.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">de 5.0</span>
          </div>

          <div className="mt-2">
            <StarRating value={summary.averageRating} size="lg" />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Baseado em <strong>{summary.totalReviews}</strong> {summary.totalReviews === 1 ? "avaliação" : "avaliações"}
          </p>

          <div className="mt-4 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>{summary.recommendPercentage}% dos clientes recomendam</span>
          </div>
        </div>

        {/* Center: Rating breakdown */}
        <div className="flex flex-col justify-center gap-2 md:col-span-5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.ratingCounts[star as 1 | 2 | 3 | 4 | 5] || 0
            const percentage = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0
            const isSelected = selectedStarFilter === star

            return (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                className={`group flex items-center gap-3 text-xs transition-colors rounded-lg px-2 py-1 ${
                  isSelected ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/40"
                }`}
              >
                <span className="w-12 shrink-0 flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
                  <span>{star}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                </span>

                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-8 text-right font-medium text-muted-foreground group-hover:text-foreground">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right: Write Review Call to action */}
        <div className="flex flex-col items-center justify-center gap-3 text-center md:border-l md:border-border/60 md:pl-6 md:col-span-3">
          <p className="text-xs font-medium text-foreground">
            Já comprou ou revendeu este produto?
          </p>
          <p className="text-[11px] text-muted-foreground">
            Compartilhe sua experiência de revenda com outros empreendedores.
          </p>
          <ReviewFormDialog
            productId={productId}
            productSlug={productSlug}
            productName={productName}
          />
        </div>
      </div>

      {/* Filter Chips */}
      {summary.totalReviews > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground">Filtrar por:</span>
          <Button
            variant={selectedStarFilter === null ? "default" : "outline"}
            size="xs"
            onClick={() => setSelectedStarFilter(null)}
          >
            Todas ({summary.totalReviews})
          </Button>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.ratingCounts[star as 1 | 2 | 3 | 4 | 5] || 0
            if (count === 0) return null
            return (
              <Button
                key={star}
                variant={selectedStarFilter === star ? "default" : "outline"}
                size="xs"
                onClick={() => setSelectedStarFilter(selectedStarFilter === star ? null : star)}
                className="gap-1"
              >
                <span>{star}</span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span>({count})</span>
              </Button>
            )
          })}
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="flex flex-col gap-4">
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center">
            <Star className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhuma avaliação encontrada com esse filtro.</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSelectedStarFilter(null)}
              className="mt-1"
            >
              Ver todas as avaliações
            </Button>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const initials = review.authorName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0].toUpperCase())
              .join("")

            const isHelpful = !!votedHelpful[review.id]
            const helpfulCount = helpfulCounts[review.id] ?? review.helpfulCount ?? 0

            return (
              <div
                key={review.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 transition-shadow hover:shadow-sm"
              >
                {/* Author Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary/80 to-primary text-xs font-semibold text-primary-foreground shadow-sm">
                      {initials || "CL"}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {review.authorName}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            Comprador(a) Verificado(a)
                          </span>
                        )}
                      </div>

                      {review.authorLocation && (
                        <span className="text-[11px] text-muted-foreground">
                          {review.authorLocation}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {/* Rating and Title */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} size="sm" />
                    <h3 className="text-sm font-semibold text-foreground">
                      {review.title}
                    </h3>
                  </div>
                </div>

                {/* Comment Body */}
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {review.comment}
                </p>

                {/* Admin Reply if present */}
                {review.adminReply && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                      <span>Resposta da Mimos Atacado</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {review.adminReply.comment}
                    </p>
                  </div>
                )}

                {/* Footer / Was this helpful */}
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <span>Essa avaliação foi útil para você?</span>

                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(review.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      isHelpful
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                    }`}
                  >
                    <ThumbsUp className={`size-3.5 ${isHelpful ? "fill-primary text-primary" : ""}`} />
                    <span>Útil</span>
                    {helpfulCount > 0 && <span>({helpfulCount})</span>}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
