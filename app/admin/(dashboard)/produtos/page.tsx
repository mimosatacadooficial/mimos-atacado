import Link from "next/link"
import Image from "next/image"
import { getAdminProducts } from "@/lib/queries/admin"
import { formatCentsToBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteProductButton } from "@/components/admin/delete-product-button"
import { Plus, Pencil } from "lucide-react"

export default async function AdminProductsPage() {
  const productList = await getAdminProducts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">{productList.length} produtos cadastrados.</p>
        </div>
        <Button render={<Link href="/admin/produtos/novo" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          Novo produto
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productList.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {product.images[0] && (
                        <Image
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="font-medium text-foreground">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {product.categoryNames.map((name) => (
                      <Badge key={name} variant="outline" className="font-normal">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{formatCentsToBRL(product.basePriceCents)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant={product.isActive ? "secondary" : "outline"}>
                      {product.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    {product.isFeatured && <Badge variant="default">Destaque</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      render={<Link href={`/admin/produtos/${product.id}`} />}
                      nativeButton={false}
                    >
                      <Pencil />
                    </Button>
                    <DeleteProductButton productId={product.id} productName={product.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
