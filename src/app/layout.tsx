import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/layout/shell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WMS — Quản lý kho",
  description: "Ứng dụng quản lý kho hàng Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
