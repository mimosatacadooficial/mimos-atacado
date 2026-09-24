"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logoutAdmin } from "@/app/actions/admin-auth"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Package, ShoppingCart, Image as ImageIcon, Star, LogOut, Sparkles, ExternalLink } from "lucide-react"

const navItems = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary">
          <Sparkles className="size-4 text-primary-foreground" />
        </div>
        <span className="font-heading text-base font-semibold text-foreground">Mimos Admin</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          render={<Link href="/" target="_blank" />}
          nativeButton={false}
        >
          <ExternalLink data-icon="inline-start" />
          Ver loja
        </Button>
        <form action={logoutAdmin}>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" type="submit">
            <LogOut data-icon="inline-start" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  )
}
