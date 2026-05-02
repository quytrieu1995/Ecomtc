import type { NextConfig } from "next"

/** Bản build gọn cho VPS (copy `.next/standalone` + static, xem `deploy/`) */
const nextConfig: NextConfig = {
  output: "standalone",
}

export default nextConfig
