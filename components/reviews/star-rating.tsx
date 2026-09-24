"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const activeValue = hoverValue !== null ? hoverValue : value

  const sizeClasses = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-6",
  }

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => interactive && setHoverValue(null)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={`Avaliação: ${value} de ${max} estrelas`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starNumber = i + 1
        const isFilled = starNumber <= activeValue
        const isHalf = !isFilled && starNumber - 0.5 <= activeValue

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starNumber)}
            onMouseEnter={() => interactive && setHoverValue(starNumber)}
            className={cn(
              "transition-transform",
              interactive
                ? "cursor-pointer hover:scale-115 focus-visible:outline-none"
                : "cursor-default"
            )}
            tabIndex={interactive ? 0 : -1}
            aria-label={`${starNumber} estrelas`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isFilled
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.35)]"
                  : isHalf
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-muted-foreground/30 fill-transparent"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
