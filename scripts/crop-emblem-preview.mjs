import sharp from "sharp"

const src = "public/images/logo-mimo-atacado-transparent.png"
const meta = await sharp(src).metadata()
console.log("[v0] size:", meta.width, meta.height)

const w = meta.width
const h = meta.height

// Estimated bounding box for the emblem (heart + lipstick + arc + sparkle),
// as fractions of the trimmed transparent logo.
const box = {
  left: Math.round(w * 0.08),
  top: 0,
  width: Math.round(w * 0.88),
  height: Math.round(h * 0.9),
}

await sharp(src).extract(box).trim().toFile("/tmp/agent-browser/emblem-preview-v4.png")
console.log("[v0] wrote preview")
