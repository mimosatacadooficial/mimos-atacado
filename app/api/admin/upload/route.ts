import { NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/lib/r2"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "products"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas arquivos de imagem são permitidos." }, { status: 400 })
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "O tamanho do arquivo não pode exceder 10MB." }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadToR2({
      buffer,
      fileName: file.name,
      contentType: file.type,
      folder,
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    })
  } catch (error: any) {
    console.error("Erro no upload R2:", error)
    return NextResponse.json(
      { error: error?.message || "Falha ao enviar arquivo para o Cloudflare R2." },
      { status: 500 }
    )
  }
}
