"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createProduct, updateProduct, type ProductInput } from "@/app/actions/admin-products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
  FieldSeparator,
} from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

type Category = { id: number; name: string }

type Tier = { minQuantity: number; priceCents: number }

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function ProductForm({
  categories,
  initialProduct,
  initialTiers,
}: {
  categories: Category[]
  initialProduct?: {
    id: number
    categoryId: number
    name: string
    slug: string
    description: string | null
    basePriceCents: number
    compareAtPriceCents: number | null
    images: string[]
    stock: number
    minQuantity: number
    isActive: boolean
    isFeatured: boolean
    sku: string | null
  }
  initialTiers?: Tier[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initialProduct?.name ?? "")
  const [slug, setSlug] = useState(initialProduct?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(!!initialProduct)
  const [categoryId, setCategoryId] = useState<string>(String(initialProduct?.categoryId ?? categories[0]?.id ?? ""))
  const [description, setDescription] = useState(initialProduct?.description ?? "")
  const [basePrice, setBasePrice] = useState(
    initialProduct ? (initialProduct.basePriceCents / 100).toFixed(2) : "",
  )
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialProduct?.compareAtPriceCents ? (initialProduct.compareAtPriceCents / 100).toFixed(2) : "",
  )
  const [images, setImages] = useState((initialProduct?.images ?? [""]).length ? initialProduct?.images ?? [""] : [""])
  const [stock, setStock] = useState(String(initialProduct?.stock ?? 0))
  const [minQuantity, setMinQuantity] = useState(String(initialProduct?.minQuantity ?? 1))
  const [sku, setSku] = useState(initialProduct?.sku ?? "")
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured ?? false)
  const [tiers, setTiers] = useState<Tier[]>(initialTiers?.length ? initialTiers : [])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function updateImage(index: number, value: string) {
    setImages((prev) => prev.map((img, i) => (i === index ? value : img)))
  }

  function addImageField() {
    setImages((prev) => [...prev, ""])
  }

  function removeImageField(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function updateTier(index: number, field: keyof Tier, value: number) {
    setTiers((prev) => prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)))
  }

  function addTier() {
    setTiers((prev) => [...prev, { minQuantity: 1, priceCents: 0 }])
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !slug.trim() || !categoryId || !basePrice) {
      toast.error("Preencha os campos obrigatórios.")
      return
    }

    const input: ProductInput = {
      categoryId: Number(categoryId),
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      basePriceCents: Math.round(Number.parseFloat(basePrice.replace(",", ".")) * 100),
      compareAtPriceCents: compareAtPrice
        ? Math.round(Number.parseFloat(compareAtPrice.replace(",", ".")) * 100)
        : null,
      images: images.filter((img) => img.trim().length > 0),
      stock: Number(stock) || 0,
      minQuantity: Number(minQuantity) || 1,
      isActive,
      isFeatured,
      sku: sku.trim(),
      priceTiers: tiers
        .filter((t) => t.minQuantity > 0 && t.priceCents > 0)
        .map((t) => ({ minQuantity: Number(t.minQuantity), priceCents: Math.round(Number(t.priceCents)) })),
    }

    startTransition(async () => {
      try {
        if (initialProduct) {
          await updateProduct(initialProduct.id, input)
        } else {
          await createProduct(input)
        }
        toast.success(initialProduct ? "Produto atualizado." : "Produto criado.")
        router.push("/admin/produtos")
      } catch (error) {
        toast.error("Não foi possível salvar o produto.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Informações básicas</FieldLegend>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Nome do produto</FieldLabel>
              <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Slug (URL)</FieldLabel>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                required
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="description">Descrição</FieldLabel>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="category">Categoria</FieldLabel>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                items={categories.map((cat) => ({ value: String(cat.id), label: cat.name }))}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="sku">SKU</FieldLabel>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Preço e estoque</FieldLegend>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="basePrice">Preço unitário (R$)</FieldLabel>
              <Input id="basePrice" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="compareAtPrice">{'Preço "de" (R$)'}</FieldLabel>
              <Input id="compareAtPrice" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
              <FieldDescription>Opcional, para mostrar desconto.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="stock">Estoque</FieldLabel>
              <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="minQuantity">Qtd. mínima</FieldLabel>
              <Input id="minQuantity" type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Faixas de preço por quantidade</FieldLegend>
        <FieldDescription>Defina descontos progressivos. Ex.: a partir de 12 un., R$ 17,90.</FieldDescription>
        <div className="flex flex-col gap-3">
          {tiers.map((tier, index) => (
            <div key={index} className="flex items-end gap-3">
              <Field className="flex-1">
                <FieldLabel>A partir de (un.)</FieldLabel>
                <Input
                  type="number"
                  value={tier.minQuantity}
                  onChange={(e) => updateTier(index, "minQuantity", Number(e.target.value))}
                />
              </Field>
              <Field className="flex-1">
                <FieldLabel>Preço unitário (R$)</FieldLabel>
                <Input
                  value={(tier.priceCents / 100).toFixed(2)}
                  onChange={(e) =>
                    updateTier(index, "priceCents", Math.round(Number.parseFloat(e.target.value || "0") * 100))
                  }
                />
              </Field>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(index)}>
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addTier}>
            <Plus data-icon="inline-start" />
            Adicionar faixa de preço
          </Button>
        </div>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Imagens</FieldLegend>
        <FieldDescription>Use caminhos locais (ex: /products/produto.png) ou URLs.</FieldDescription>
        <div className="flex flex-col gap-3">
          {images.map((image, index) => (
            <div key={index} className="flex items-end gap-3">
              <Field className="flex-1">
                <FieldLabel>Imagem {index + 1}</FieldLabel>
                <Input value={image} onChange={(e) => updateImage(index, e.target.value)} />
              </Field>
              {images.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeImageField(index)}>
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addImageField}>
            <Plus data-icon="inline-start" />
            Adicionar imagem
          </Button>
        </div>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Visibilidade</FieldLegend>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="isActive">Produto ativo</FieldLabel>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="isFeatured">Produto em destaque</FieldLabel>
            <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : initialProduct ? "Salvar alterações" : "Criar produto"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/produtos")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
