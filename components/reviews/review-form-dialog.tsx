"use client"

import { useState } from "react"
import { Star, MessageSquarePlus, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StarRating } from "./star-rating"
import { submitProductReview } from "@/app/actions/reviews"

interface ReviewFormDialogProps {
  productId: number
  productSlug: string
  productName: string
  onReviewSubmitted?: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: "Muito insatisfeito",
  2: "Pode melhorar",
  3: "Bom produto",
  4: "Muito bom, recomendo!",
  5: "Excelente! Perfeito para revender com lucro",
}

export function ReviewFormDialog({
  productId,
  productSlug,
  productName,
  onReviewSubmitted,
}: ReviewFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [rating, setRating] = useState<number>(5)
  const [authorName, setAuthorName] = useState("")
  const [authorLocation, setAuthorLocation] = useState("")
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authorName.trim()) {
      toast.error("Por favor, preencha o seu nome ou o nome da sua loja.")
      return
    }
    if (!title.trim()) {
      toast.error("Por favor, informe um título para sua avaliação.")
      return
    }
    if (!comment.trim() || comment.trim().length < 10) {
      toast.error("Escreva um comentário um pouco mais detalhado (mínimo 10 caracteres).")
      return
    }

    setIsPending(true)
    try {
      const res = await submitProductReview({
        productId,
        productSlug,
        productName,
        authorName,
        authorLocation: authorLocation.trim() || "Revendedor(a) Verificado(a)",
        rating,
        title,
        comment,
      })

      if (res.success) {
        toast.success("Avaliação enviada com sucesso! Muito obrigado.", {
          description: "Sua opinião ajuda outros revendedores a escolherem os melhores produtos.",
        })
        setOpen(false)
        setAuthorName("")
        setAuthorLocation("")
        setTitle("")
        setComment("")
        setRating(5)
        onReviewSubmitted?.()
      } else {
        toast.error(res.error || "Não foi possível enviar a avaliação.")
      }
    } catch {
      toast.error("Erro inesperado ao enviar. Tente novamente.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className="font-medium shadow-sm transition-all hover:shadow-md"
      >
        <MessageSquarePlus className="size-4" />
        Avaliar este produto
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-heading">
            <Star className="size-5 fill-amber-400 text-amber-400" />
            Avaliar Produto
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {productName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Rating picker */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/30 p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Sua nota geral:</span>
            <StarRating
              value={rating}
              interactive
              size="lg"
              onChange={(newRating) => setRating(newRating)}
            />
            <span className="text-xs font-semibold text-primary transition-all">
              {RATING_LABELS[rating]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="authorName" className="text-xs font-medium">
                Seu Nome ou Loja <span className="text-destructive">*</span>
              </Label>
              <Input
                id="authorName"
                placeholder="Ex: Amanda Silva (Lojista)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="authorLocation" className="text-xs font-medium">
                Cidade e Estado (opcional)
              </Label>
              <Input
                id="authorLocation"
                placeholder="Ex: Ribeirão Preto - SP"
                value={authorLocation}
                onChange={(e) => setAuthorLocation(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Título da Avaliação <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Excelente qualidade e ótima saída para revenda!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comment" className="text-xs font-medium">
              Seu Comentário Detalhado <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment"
              rows={4}
              placeholder="Conte o que achou da qualidade, embalagem, entrega, aceitação dos seus clientes e facilidade na revenda..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Sua avaliação receberá o selo de <strong>Compra Verificada</strong> após a publicação.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar Avaliação"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
