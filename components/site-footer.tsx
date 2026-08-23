import Link from "next/link"
import { Sparkles, Truck, ShieldCheck, PackageOpen } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold text-foreground">Mimos Atacado</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Maquiagem, skincare e acessórios de beleza no atacado para revendedores em todo o Brasil.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-sm font-semibold text-foreground">Institucional</h3>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            Sobre nós
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            Política de trocas
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            Fale conosco
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-sm font-semibold text-foreground">Atendimento</h3>
          <p className="text-sm text-muted-foreground">Seg a sex, 9h às 18h</p>
          <p className="text-sm text-muted-foreground">contato@mimosatacado.com.br</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Truck className="size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">Entregamos para todo o Brasil</p>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">Compra 100% segura</p>
          </div>
          <div className="flex items-center gap-3">
            <PackageOpen className="size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">Preços exclusivos de atacado</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Mimos Atacado. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
