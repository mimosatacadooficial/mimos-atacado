"use client"

import { useState, useTransition } from "react"
import { createBanner, updateBanner, deleteBanner, type BannerInput } from "@/app/actions/admin-banners"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Upload, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

type Banner = {
  id: number
  title: string
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  sortOrder: number
  isActive: boolean
}

export function BannerFormDialog({ banner }: { banner?: Banner }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(banner?.title ?? "")
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "")
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "")
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "/produtos")
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? 0))
  const [isActive, setIsActive] = useState(banner?.isActive ?? true)
  const [isUploading, setIsUploading] = useState(false)

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "banners")

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro no upload")
      }
      setImageUrl(data.url)
      toast.success("Banner enviado para o Cloudflare R2 com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !imageUrl.trim()) {
      toast.error("Preencha os campos obrigatórios.")
      return
    }

    const input: BannerInput = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim(),
      sortOrder: Number(sortOrder) || 0,
      isActive,
    }

    startTransition(async () => {
      if (banner) {
        await updateBanner(banner.id, input)
        toast.success("Banner atualizado.")
      } else {
        await createBanner(input)
        toast.success("Banner criado.")
        setTitle("")
        setSubtitle("")
        setImageUrl("")
      }
      setOpen(false)
    })
  }

  function handleDelete() {
    if (!banner) return
    startTransition(async () => {
      await deleteBanner(banner.id)
      toast.success("Banner removido.")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {banner ? (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Editar ${banner.title}`}>
          <Pencil />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          Novo banner
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{banner ? "Editar banner" : "Novo banner"}</DialogTitle>
          <DialogDescription>Banners aparecem no topo da página inicial.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Título</FieldLabel>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="subtitle">Subtítulo</FieldLabel>
              <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="imageUrl">Imagem do banner</FieldLabel>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    placeholder="https://pub-...r2.dev/banners/... ou faça upload"
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleBannerUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="pointer-events-none"
                      disabled={isUploading}
                    >
                      {isUploading ? (
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
                </div>
                {imageUrl.trim().length > 0 && (
                  <div className="relative h-20 w-full overflow-hidden rounded-lg border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="linkUrl">Link de destino</FieldLabel>
              <Input id="linkUrl" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="sortOrder">Ordem</FieldLabel>
              <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="isActive">Banner ativo</FieldLabel>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </Field>
          </FieldGroup>
          <DialogFooter className="justify-between sm:justify-between">
            {banner ? (
              <Button type="button" variant="ghost" className="text-destructive" onClick={handleDelete} disabled={isPending}>
                <Trash2 data-icon="inline-start" />
                Excluir
              </Button>
            ) : (
              <div />
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
