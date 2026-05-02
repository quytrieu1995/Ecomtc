import { OrderStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const getReportData = async () => {
  const [orders, productAgg] = await Promise.all([
    prisma.order.findMany({
      select: { status: true, total: true, channel: true },
    }),
    prisma.orderItem.findMany({
      select: {
        quantity: true,
        order: { select: { status: true } },
        productId: true,
      },
    }),
  ])

  const ordersNet = orders.filter(
    (o) =>
      o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED,
  )

  const channelMap = new Map<
    string,
    { revenue: number; orders: number }
  >()
  for (const o of ordersNet) {
    const row = channelMap.get(o.channel) ?? { revenue: 0, orders: 0 }
    row.revenue += o.total
    row.orders += 1
    channelMap.set(o.channel, row)
  }
  const channels = [...channelMap.entries()].map(([channel, v]) => ({
    channel,
    revenue: v.revenue,
    orders: v.orders,
  }))

  const revenueConfirmed = orders
    .filter(
      (o) =>
        o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED,
    )
    .reduce((s, o) => s + o.total, 0)

  const returnCount = orders.filter((o) => o.status === OrderStatus.RETURNED).length
  const cancelCount = orders.filter((o) => o.status === OrderStatus.CANCELLED).length

  let returnedUnits = 0
  let cancelledUnits = 0
  for (const row of productAgg) {
    if (row.order.status === OrderStatus.RETURNED) returnedUnits += row.quantity
    if (row.order.status === OrderStatus.CANCELLED) cancelledUnits += row.quantity
  }

  const productRows = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      price: true,
      orderItems: {
        select: {
          quantity: true,
          order: { select: { status: true } },
        },
      },
    },
  })

  const productReport = productRows.map((p) => {
    let sold = 0
    let returned = 0
    for (const oi of p.orderItems) {
      if (
        oi.order.status !== OrderStatus.CANCELLED &&
        oi.order.status !== OrderStatus.RETURNED
      ) {
        sold += oi.quantity
      }
      if (oi.order.status === OrderStatus.RETURNED) returned += oi.quantity
    }
    return {
      name: p.name,
      sku: p.sku,
      stock: p.quantity,
      price: p.price,
      sold,
      returned,
    }
  })

  return {
    revenueConfirmed,
    returnCount,
    cancelCount,
    returnedUnits,
    cancelledUnits,
    channels,
    productReport,
  }
}
