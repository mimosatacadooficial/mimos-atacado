import { NextResponse, type NextRequest } from "next/server"
import { getAdminCookieName, getAdminToken } from "@/lib/admin/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(getAdminCookieName())
  const expectedToken = await getAdminToken()
  if (cookie?.value !== expectedToken) {
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
