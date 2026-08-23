"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getAdminCookieName, getAdminToken, verifyAdminPassword } from "@/lib/admin/auth"

export async function loginAdmin(password: string) {
  if (!verifyAdminPassword(password)) {
    return { success: false, error: "Senha incorreta." }
  }

  const cookieStore = await cookies()
  const token = await getAdminToken()
  cookieStore.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return { success: true }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(getAdminCookieName())
  redirect("/admin/login")
}
