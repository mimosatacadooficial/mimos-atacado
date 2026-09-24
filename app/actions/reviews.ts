"use server"

import { revalidatePath } from "next/cache"
import {
  createProductReview,
  deleteReviewById,
  toggleReviewApproval,
  incrementHelpfulVote,
} from "@/lib/reviews/store"

export interface SubmitReviewInput {
  productId: number
  productSlug: string
  productName: string
  authorName: string
  authorLocation?: string
  rating: number
  title: string
  comment: string
}

export async function submitProductReview(input: SubmitReviewInput) {
  try {
    if (!input.authorName || input.authorName.trim().length < 2) {
      return { success: false, error: "Por favor, informe seu nome." }
    }
    if (!input.rating || input.rating < 1 || input.rating > 5) {
      return { success: false, error: "Por favor, selecione uma nota de 1 a 5 estrelas." }
    }
    if (!input.title || input.title.trim().length < 3) {
      return { success: false, error: "Por favor, informe um título para sua avaliação." }
    }
    if (!input.comment || input.comment.trim().length < 10) {
      return { success: false, error: "Por favor, escreva um comentário com pelo menos 10 caracteres." }
    }

    const review = await createProductReview({
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      authorName: input.authorName,
      authorLocation: input.authorLocation || "Revendedor(a) Verificado(a)",
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      isVerifiedPurchase: true,
    })

    revalidatePath(`/produto/${input.productSlug}`)
    revalidatePath("/produtos")
    revalidatePath("/admin/avaliacoes")

    return { success: true, review }
  } catch (error: any) {
    console.error("Error submitting review:", error)
    return { success: false, error: error?.message || "Erro ao enviar avaliação." }
  }
}

export async function voteReviewHelpful(reviewId: string, productSlug: string) {
  try {
    const helpfulCount = await incrementHelpfulVote(reviewId)
    revalidatePath(`/produto/${productSlug}`)
    return { success: true, helpfulCount }
  } catch (error: any) {
    console.error("Error voting helpful:", error)
    return { success: false, error: "Erro ao votar." }
  }
}

export async function adminToggleApprovalAction(id: string, productSlug?: string) {
  try {
    const updated = await toggleReviewApproval(id)
    if (productSlug) {
      revalidatePath(`/produto/${productSlug}`)
    }
    revalidatePath("/admin/avaliacoes")
    return { success: true, updated }
  } catch (error: any) {
    console.error("Error toggling approval:", error)
    return { success: false, error: "Erro ao atualizar status." }
  }
}

export async function adminDeleteReviewAction(id: string, productSlug?: string) {
  try {
    const success = await deleteReviewById(id)
    if (productSlug) {
      revalidatePath(`/produto/${productSlug}`)
    }
    revalidatePath("/admin/avaliacoes")
    return { success }
  } catch (error: any) {
    console.error("Error deleting review:", error)
    return { success: false, error: "Erro ao excluir avaliação." }
  }
}

export async function adminCreateReviewAction(input: SubmitReviewInput & { isVerifiedPurchase?: boolean }) {
  try {
    const review = await createProductReview({
      ...input,
      isVerifiedPurchase: input.isVerifiedPurchase ?? true,
    })
    revalidatePath(`/produto/${input.productSlug}`)
    revalidatePath("/admin/avaliacoes")
    return { success: true, review }
  } catch (error: any) {
    console.error("Error creating admin review:", error)
    return { success: false, error: "Erro ao cadastrar avaliação." }
  }
}
