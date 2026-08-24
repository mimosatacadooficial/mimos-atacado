import sharp from "sharp"

const src = "public/images/logo-mimo-atacado-transparent.png"
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h, channels } = info

const alphaAt = (x, y) => data[(y * w + x) * channels + 3]
const visited = new Uint8Array(w * h)

const components = []

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = y * w + x
    if (visited[idx]) continue
    if (alphaAt(x, y) < 20) {
      visited[idx] = 1
      continue
    }
    // BFS
    let minX = x, maxX = x, minY = y, maxY = y, count = 0
    const stack = [[x, y]]
    visited[idx] = 1
    while (stack.length) {
      const [cx, cy] = stack.pop()
      count++
      if (cx < minX) minX = cx
      if (cx > maxX) maxX = cx
      if (cy < minY) minY = cy
      if (cy > maxY) maxY = cy
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const nx = cx + dx, ny = cy + dy
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        const nidx = ny * w + nx
        if (visited[nidx]) continue
        if (alphaAt(nx, ny) < 20) {
          visited[nidx] = 1
          continue
        }
        visited[nidx] = 1
        stack.push([nx, ny])
      }
    }
    components.push({ minX, maxX, minY, maxY, count })
  }
}

components.sort((a, b) => b.count - a.count)
console.log("[v0] total components:", components.length)
for (const c of components.slice(0, 25)) {
  console.log(
    `[v0] area=${c.count.toString().padStart(7)} bbox=(x:${c.minX}-${c.maxX}, y:${c.minY}-${c.maxY}) w=${c.maxX - c.minX} h=${c.maxY - c.minY}`
  )
}
