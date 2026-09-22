import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getAdminCookieName, getAdminToken } from "@/lib/admin/auth"

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(getAdminCookieName())
  const expectedToken = await getAdminToken()

  if (cookie?.value !== expectedToken) {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
