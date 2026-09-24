"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductRatingSummary } from "@/lib/reviews/types"

interface ProductRatingBadgeProps {
  summary: ProductRatingSummary
  variant?: "compact" | "full"
  className?: string
}

export function ProductRatingBadge({
  summary,
  variant = "compact",
  className,
}: ProductRatingBadgeProps) {
  const scrollToReviews = (e: React.MouseEvent) => {
    if (variant === "full") {
      e.preventDefault()
      const element = document.getElementById("avaliacoes")
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <span className="flex items-center text-amber-500 font-semibold gap-0.5">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          {summary.averageRating.toFixed(1)}
        </span>
        <span>({summary.totalReviews})</span>
      </div>
    )
  }

  return (
    <a
      href="#avaliacoes"
      onClick={scrollToReviews}
      className={cn(
        "group inline-flex flex-wrap items-center gap-2 text-xs transition-colors hover:opacity-90",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <div className="flex items-center text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-3.5",
                i < Math.round(summary.averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <span className="font-semibold text-foreground">{summary.averageRating.toFixed(1)}</span>
      </div>

      <span className="text-muted-foreground group-hover:text-primary transition-colors underline underline-offset-2">
        ({summary.totalReviews} {summary.totalReviews === 1 ? "avaliação" : "avaliações"} de revendedores)
      </span>

      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        ✓ {summary.recommendPercentage}% recomendam
      </span>
    </a>
  )
}
