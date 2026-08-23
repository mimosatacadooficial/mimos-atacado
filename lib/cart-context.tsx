"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type CartItem = {
  productId: number
  slug: string
  name: string
  image: string
  unitPriceCents: number
  quantity: number
  minQuantity: number
  priceTiers: { minQuantity: number; priceCents: number }[]
  basePriceCents: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  itemCount: number
  subtotalCents: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = "mimos-atacado-cart"

function getUnitPrice(tiers: { minQuantity: number; priceCents: number }[], base: number, quantity: number) {
  const eligible = tiers.filter((t) => quantity >= t.minQuantity).sort((a, b) => b.minQuantity - a.minQuantity)
  return eligible[0]?.priceCents ?? base
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem: CartContextValue["addItem"] = (item, quantity) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        const newQuantity = existing.quantity + quantity
        return prev.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: newQuantity,
                unitPriceCents: getUnitPrice(i.priceTiers, i.basePriceCents, newQuantity),
              }
            : i
        )
      }
      return [
        ...prev,
        {
          ...item,
          quantity,
          unitPriceCents: getUnitPrice(item.priceTiers, item.basePriceCents, quantity),
        },
      ]
    })
  }

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity,
                unitPriceCents: getUnitPrice(i.priceTiers, i.basePriceCents, quantity),
              }
            : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const clearCart = () => setItems([])

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, itemCount, subtotalCents }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within a CartProvider")
  return ctx
}
