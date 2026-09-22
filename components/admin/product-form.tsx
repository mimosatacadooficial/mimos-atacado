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
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Upload, Loader2, Image as ImageIcon } from "lucide-react"
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
  initialCategoryIds,
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
  initialCategoryIds?: number[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initialProduct?.name ?? "")
  const [slug, setSlug] = useState(initialProduct?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(!!initialProduct)
  const [categoryIds, setCategoryIds] = useState<number[]>(
    initialCategoryIds?.length
      ? initialCategoryIds
      : initialProduct?.categoryId
        ? [initialProduct.categoryId]
        : [],
  )
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
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  async function handleFileUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingIndex(index)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "products")

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro no upload")
      }
      updateImage(index, data.url)
      toast.success("Imagem enviada para o Cloudflare R2 com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.")
    } finally {
      setUploadingIndex(null)
      e.target.value = ""
    }
  }

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function toggleCategory(id: number, checked: boolean) {
    setCategoryIds((prev) => (checked ? [...prev, id] : prev.filter((catId) => catId !== id)))
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

    if (!name.trim() || !slug.trim() || categoryIds.length === 0 || !basePrice) {
      toast.error("Preencha os campos obrigatórios e selecione ao menos uma categoria.")
      return
    }

    const input: ProductInput = {
      categoryIds,
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
        toast.success(initialProduct ? "Produto atualizado com sucesso." : "Produto criado com sucesso.")
        router.push("/admin/produtos")
        router.refresh()
      } catch (error: any) {
        toast.error(error?.message || "Não foi possível salvar o produto.")
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
          <Field>
            <FieldLabel>Categorias</FieldLabel>
            <FieldDescription>Selecione uma ou mais categorias para este produto.</FieldDescription>
            <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg border border-border p-4">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={categoryIds.includes(cat.id)}
                    onCheckedChange={(checked) => toggleCategory(cat.id, checked === true)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <FieldLegend>Imagens do produto</FieldLegend>
        <FieldDescription>
          Envie fotos do seu computador diretamente para o <strong>Cloudflare R2</strong> ou cole URLs de imagens.
        </FieldDescription>
        <div className="flex flex-col gap-4">
          {images.map((image, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
              {image.trim().length > 0 ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}

              <Field className="flex-1">
                <FieldLabel>URL da Imagem {index + 1}</FieldLabel>
                <Input
                  value={image}
                  placeholder="https://pub-...r2.dev/products/... ou faça upload"
                  onChange={(e) => updateImage(index, e.target.value)}
                />
              </Field>

              <div className="flex items-center gap-2 self-end sm:self-auto sm:pt-6">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingIndex === index}
                    onChange={(e) => handleFileUpload(index, e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="pointer-events-none"
                    disabled={uploadingIndex === index}
                  >
                    {uploadingIndex === index ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1.5" />
                        Upload R2
                      </>
                    )}
                  </Button>
                </label>

                {images.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeImageField(index)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addImageField}>
            <Plus data-icon="inline-start" />
            Adicionar mais imagens
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
