"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingCart,
  BarChart3,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/products", label: "Sản phẩm", icon: Package },
  { href: "/stock", label: "Xuất / nhập kho", icon: ArrowLeftRight },
  { href: "/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  { href: "/settings", label: "Cài đặt Nhanh.vn", icon: Settings },
]

export const AppSidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
      <div className="border-b px-4 py-4">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          WMS · Kho hàng
        </Link>
        <p className="text-xs text-muted-foreground">Quản lý tồn & đơn</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Điều hướng chính">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
