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
  const isDev = process.env.NODE_ENV === "development"
  cookieStore.set(getAdminCookieName(), token, {
    httpOnly: true,
    // The v0 preview renders the app inside a cross-site iframe. A "lax"
    // cookie is silently dropped there, which makes the admin session
    // appear to never persist. "none" (with secure) is required in dev.
    secure: true,
    sameSite: isDev ? "none" : "lax",
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
