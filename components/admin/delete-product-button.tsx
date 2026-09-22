"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteProduct } from "@/app/actions/admin-products"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function DeleteProductButton({
  productId,
  productName,
  onDeleted,
}: {
  productId: number
  productName: string
  onDeleted?: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const result = await deleteProduct(productId)
        if (result && !result.success) {
          toast.error(result.error || "Erro ao excluir o produto do servidor.")
          return
        }

        toast.success(`"${productName}" foi excluído do servidor com sucesso.`)
        setOpen(false)
        onDeleted?.(productId)
        router.refresh()
      } catch (err: any) {
        console.error("Delete error:", err)
        toast.error(err?.message || "Não foi possível excluir o produto do servidor.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Excluir ${productName}`}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-4" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir produto do servidor</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir &quot;{productName}&quot;? Essa ação removerá o produto do servidor e do banco de dados definitivamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Excluindo do servidor...
              </span>
            ) : (
              "Excluir definitivamente"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
