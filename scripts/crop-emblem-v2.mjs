import sharp from "sharp"

const src = "public/images/logo-mimo-atacado-transparent.png"

const box = { left: 220, top: 0, width: 1150 - 220, height: 500 }

await sharp(src).extract(box).toFile("/tmp/agent-browser/emblem-v5.png")
console.log("[v0] done", box)
