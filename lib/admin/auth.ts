// Senha padrão do painel admin. Você pode trocar definindo a variável de
// ambiente ADMIN_PASSWORD nas configurações do projeto.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mimos2024"
const COOKIE_NAME = "mimos_admin_session"

// Usamos Web Crypto (disponível no Edge Runtime) em vez do módulo "crypto"
// do Node, que não funciona dentro do middleware.
async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function verifyAdminPassword(password: string) {
  return password === ADMIN_PASSWORD
}

export function getAdminCookieName() {
  return COOKIE_NAME
}

export async function getAdminToken() {
  return sha256Hex(`mimos-admin-session:${ADMIN_PASSWORD}`)
}
