import { OrderStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const getDashboardStats = async () => {
  const [products, totalQtyAgg, newOrders, topSold] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, quantity: true, price: true, minStock: true },
    }),
    prisma.product.aggregate({ _sum: { quantity: true } }),
    prisma.order.count({ where: { status: OrderStatus.NEW } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ])

  const inventoryValue = products.reduce(
    (acc, p) => acc + p.quantity * p.price,
    0,
  )

  const lowStockCount = products.filter((p) => p.quantity <= p.minStock).length

  const productMap = new Map(products.map((p) => [p.id, p]))
  const topProducts = await Promise.all(
    topSold.map(async (row) => {
      const prod = await prisma.product.findUnique({
        where: { id: row.productId },
        select: { name: true, sku: true },
      })
      return {
        name: prod?.name ?? "—",
        sku: prod?.sku ?? "—",
        sold: row._sum.quantity ?? 0,
      }
    }),
  )

  return {
    totalStockUnits: totalQtyAgg._sum.quantity ?? 0,
    inventoryValue,
    newOrders,
    lowStockCount,
    topProducts,
  }
}
