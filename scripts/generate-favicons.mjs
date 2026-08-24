import sharp from "sharp"
import fs from "node:fs"

const src = "public/images/logo-mimo-atacado-transparent.png"

// Emblem crop: lipstick + heart + arc + sparkle, excluding the "Mimo" wordmark.
const emblemBox = { left: 310, top: 0, width: 1150 - 310, height: 480 }

async function buildSquare({ background, size, outFile, padPct }) {
  const emblem = await sharp(src).extract(emblemBox).trim().toBuffer()
  const meta = await sharp(emblem).metadata()
  const innerSize = Math.round(size * (1 - padPct * 2))
  const resized = await sharp(emblem)
    .resize({
      width: innerSize,
      height: innerSize,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(outFile)

  console.log("[v0] wrote", outFile, "from emblem", meta.width, meta.height)
}

// Transparent favicons (32x32) — used for both light and dark browser tabs.
await buildSquare({
  background: { r: 0, g: 0, b: 0, alpha: 0 },
  size: 32,
  outFile: "public/icon-light-32x32.png",
  padPct: 0.06,
})
await buildSquare({
  background: { r: 0, g: 0, b: 0, alpha: 0 },
  size: 32,
  outFile: "public/icon-dark-32x32.png",
  padPct: 0.06,
})

// Apple touch icon (opaque background, matches site background token).
await buildSquare({
  background: { r: 253, g: 241, b: 245, alpha: 1 },
  size: 180,
  outFile: "public/apple-icon.png",
  padPct: 0.14,
})

// A larger master PNG, embedded as base64 inside icon.svg so vector-preferring
// browsers still get the real brand mark instead of the old placeholder icon.
const masterBuffer = await sharp({
  create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    {
      input: await sharp(src)
        .extract(emblemBox)
        .trim()
        .resize({ width: 112, height: 112, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toBuffer()

const base64 = masterBuffer.toString("base64")
const svg = `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${base64}" width="128" height="128" />
</svg>
`
fs.writeFileSync("public/icon.svg", svg)
console.log("[v0] wrote public/icon.svg")
