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
import { Plus, Pencil, Trash2 } from "lucide-react"
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
              <FieldLabel htmlFor="imageUrl">Imagem (caminho ou URL)</FieldLabel>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
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
