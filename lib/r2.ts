import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "3ba2d09cbe5f5e41c662f0cfcd389688"
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "8ea963a0b1825e501dccf4de5d90c15b"
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "2870c78f0976edac2cc4f98e016cad1b52d85885385bfe11fe326f8e1ab27d88"
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mimos-atacado"
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-db4e48567ea54fc7b07ee1ddbc1f01eb.r2.dev"

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

export interface UploadOptions {
  buffer: Buffer | Uint8Array
  fileName: string
  contentType: string
  folder?: string
}

export async function uploadToR2({
  buffer,
  fileName,
  contentType,
  folder = "products",
}: UploadOptions): Promise<{ url: string; key: string }> {
  // Sanitize filename and create unique timestamp-prefixed key
  const cleanName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
  
  const key = `${folder}/${Date.now()}-${cleanName}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  })

  await s3Client.send(command)

  return {
    url: `${R2_PUBLIC_URL}/${key}`,
    key,
  }
}
