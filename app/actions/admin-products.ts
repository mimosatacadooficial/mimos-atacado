"use server"

import { revalidatePath } from "next/cache"
import {
  createCatalogProduct,
  updateCatalogProduct,
  deleteCatalogProduct,
  getProductWithTiers as getCatalogProductWithTiers,
  type ProductInput,
  type PriceTierInput,
} from "@/lib/catalog"

export type { ProductInput, PriceTierInput }

export async function createProduct(input: ProductInput) {
  const result = await createCatalogProduct(input)
  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
  revalidatePath("/")
  revalidatePath(`/produto/${input.slug}`)
  return result
}

export async function updateProduct(id: number, input: ProductInput) {
  const result = await updateCatalogProduct(id, input)
  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
  revalidatePath("/")
  revalidatePath(`/produto/${input.slug}`)
  return result
}

export async function deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await deleteCatalogProduct(id)
    revalidatePath("/admin/produtos")
    revalidatePath("/produtos")
    revalidatePath("/")
    return result
  } catch (err: any) {
    console.error("Failed to delete product:", err)
    return { success: false, error: err?.message || "Erro ao excluir o produto do servidor." }
  }
}

export async function getProductWithTiers(id: number) {
  return getCatalogProductWithTiers(id)
}
