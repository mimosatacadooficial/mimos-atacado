"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { orders, orderItems } from "@/lib/db/schema"
import { createPixPayment, type MonsterPayUtms } from "@/lib/monsterpay"

export type CheckoutCartItem = {
  productId: number
  quantity: number
}

export type CheckoutCustomer = {
  name: string
  email: string
  phone: string
  document: string
}

export type CreateOrderResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string }

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MA-${timestamp}-${random}`
}

/**
 * Creates an order and generates a real PIX charge on MonsterPay.
 * IMPORTANT: No personal customer data (name, email, phone, CPF, address) is
 * ever persisted here. Those fields are sent directly to the MonsterPay API to
 * generate the PIX charge, but only the resulting payment id/code and
 * anonymous product/quantity/price/UTM data are saved to the database.
 */
export async function createOrder(
  items: CheckoutCartItem[],
  shipping: { state?: string; city?: string },
  customer: CheckoutCustomer,
  utms: MonsterPayUtms,
  sourceUrl?: string
): Promise<CreateOrderResult> {
  if (!items.length) {
    return { success: false, error: "O carrinho está vazio." }
  }

  try {
    const productIds = items.map((item) => item.productId)
    const dbProducts = await db.query.products.findMany({
      where: (p, { inArray }) => inArray(p.id, productIds),
    })

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    let subtotalCents = 0
    const itemsToInsert: {
      productId: number
      productName: string
      quantity: number
      unitPriceCents: number
      totalPriceCents: number
    }[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) continue
      if (item.quantity < product.minQuantity) {
        return {
          success: false,
          error: `A quantidade mínima para "${product.name}" é ${product.minQuantity} unidades.`,
        }
      }

      const tiers = await db.query.productPriceTiers.findMany({
        where: (t, { eq }) => eq(t.productId, product.id),
      })
      const applicableTier = tiers
        .filter((t) => item.quantity >= t.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0]
      const unitPrice = applicableTier?.priceCents ?? product.basePriceCents

      const totalPrice = unitPrice * item.quantity
      subtotalCents += totalPrice

      itemsToInsert.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceCents: unitPrice,
        totalPriceCents: totalPrice,
      })
    }

    if (!itemsToInsert.length) {
      return { success: false, error: "Nenhum produto válido encontrado no carrinho." }
    }

    const shippingCents = subtotalCents >= 30000 ? 0 : 1990
    const totalCents = subtotalCents + shippingCents
    const orderNumber = generateOrderNumber()

    const requestHeaders = await headers()
    const documentDigits = customer.document.replace(/\D/g, "")
    const phoneDigits = customer.phone.replace(/\D/g, "")

    const paymentResult = await createPixPayment({
      amountCents: totalCents,
      customerName: customer.name,
      customerEmail: customer.email,
      customerDocument: documentDigits || undefined,
      customerPhone: phoneDigits || undefined,
      description: `Pedido ${orderNumber} - Mimos Atacado`,
      sourceUrl,
      userAgent: requestHeaders.get("user-agent") ?? undefined,
      ...utms,
    })

    if (!paymentResult.success) {
      return { success: false, error: paymentResult.error }
    }

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        status: "aguardando_pagamento",
        subtotalCents,
        shippingCents,
        totalCents,
        shippingState: shipping.state ?? null,
        shippingCity: shipping.city ?? null,
        itemCount: itemsToInsert.reduce((sum, i) => sum + i.quantity, 0),
        pixPaymentId: paymentResult.id,
        pixCode: paymentResult.pixCode,
        pixExpiresAt: paymentResult.expiresAt ? new Date(paymentResult.expiresAt) : null,
        utmSource: utms.utmSource ?? null,
        utmCampaign: utms.utmCampaign ?? null,
        utmMedium: utms.utmMedium ?? null,
        utmContent: utms.utmContent ?? null,
        utmTerm: utms.utmTerm ?? null,
        src: utms.src ?? null,
        sck: utms.sck ?? null,
      })
      .returning()

    await db.insert(orderItems).values(
      itemsToInsert.map((item) => ({
        orderId: order.id,
        ...item,
      }))
    )

    return { success: true, orderNumber: order.orderNumber }
  } catch (error) {
    console.error("[v0] Failed to create order:", error)
    return { success: false, error: "Não foi possível criar o pedido. Tente novamente." }
  }
}
