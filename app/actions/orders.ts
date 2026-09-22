"use server"

import { db } from "@/lib/db"
import { orders, orderItems } from "@/lib/db/schema"
import { createPixPayment, type SelectusPayUtms } from "@/lib/selectuspay"
import { DEFAULT_PRODUCTS } from "@/lib/data/mock-data"

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

import { saveInMemoryOrder, type CachedOrder } from "@/lib/orders/memory-store"


/**
 * Cria um pedido e gera a cobrança PIX real via SelectusPay.
 */
export async function createOrder(
  items: CheckoutCartItem[],
  shipping: { state?: string; city?: string },
  customer: CheckoutCustomer,
  utms: SelectusPayUtms,
  sourceUrl?: string
): Promise<CreateOrderResult> {
  if (!items.length) {
    return { success: false, error: "O carrinho está vazio." }
  }

  try {
    const productIds = items.map((item) => item.productId)
    let productList: any[] = []

    if (process.env.DATABASE_URL) {
      try {
        productList = await db.query.products.findMany({
          where: (p, { inArray }) => inArray(p.id, productIds),
        })
      } catch (err) {
        console.warn("DB query error in createOrder, using DEFAULT_PRODUCTS:", err)
      }
    }

    if (!productList.length) {
      productList = DEFAULT_PRODUCTS.filter((p) => productIds.includes(p.id))
    }

    const productMap = new Map(productList.map((p) => [p.id, p]))

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

      let unitPrice = product.basePriceCents
      if (product.priceTiers && Array.isArray(product.priceTiers)) {
        const eligible = product.priceTiers
          .filter((t: any) => item.quantity >= t.minQuantity)
          .sort((a: any, b: any) => b.minQuantity - a.minQuantity)[0]
        if (eligible) {
          unitPrice = eligible.priceCents
        }
      }

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

    // 1. Gera cobrança PIX na SelectusPay
    const paymentResult = await createPixPayment({
      amountCents: totalCents,
      customerName: customer.name,
      customerEmail: customer.email,
      customerDocument: customer.document,
      customerPhone: customer.phone,
      description: `Pedido ${orderNumber} - Mimos Atacado`,
      items: itemsToInsert.map((item) => ({
        title: item.productName,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      })),
      ...utms,
    })

    if (!paymentResult.success) {
      return { success: false, error: paymentResult.error }
    }

    const cachedOrder: CachedOrder = {
      id: Math.floor(Math.random() * 10000) + 1,
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
      createdAt: new Date(),
    }

    saveInMemoryOrder(orderNumber, cachedOrder)

    // 2. Persiste no banco de dados se configurado
    if (process.env.DATABASE_URL) {
      try {
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
            itemCount: cachedOrder.itemCount,
            pixPaymentId: paymentResult.id,
            pixCode: paymentResult.pixCode,
            pixExpiresAt: cachedOrder.pixExpiresAt,
            utmSource: utms.utmSource ?? null,
            utmCampaign: utms.utmCampaign ?? null,
            utmMedium: utms.utmMedium ?? null,
            utmContent: utms.utmContent ?? null,
            utmTerm: utms.utmTerm ?? null,
            src: utms.src ?? null,
            sck: utms.sck ?? null,
          })
          .returning()

        if (order) {
          cachedOrder.id = order.id
          await db.insert(orderItems).values(
            itemsToInsert.map((item) => ({
              orderId: order.id,
              ...item,
            }))
          )
        }
      } catch (dbErr) {
        console.warn("DB insert error, order kept in memory store:", dbErr)
      }
    }

    return { success: true, orderNumber }
  } catch (error) {
    console.error("Failed to create order with SelectusPay:", error)
    return { success: false, error: "Não foi possível criar o pedido. Tente novamente." }
  }
}
