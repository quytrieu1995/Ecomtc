import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { OrderCreateForm } from "@/components/orders/order-create-form"
import {
  cancelOrder,
  markOrderReturned,
  updateOrderStatusForm,
  updateTrackingForm,
} from "@/server/orders"
import { cn } from "@/lib/utils"

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: "Mới",
  [OrderStatus.PROCESSING]: "Đang xử lý",
  [OrderStatus.SHIPPED]: "Đang giao",
  [OrderStatus.DELIVERED]: "Đã giao",
  [OrderStatus.RETURNED]: "Hoàn hàng",
  [OrderStatus.CANCELLED]: "Đã hủy",
}

const statusBadge = (s: OrderStatus) => {
  switch (s) {
    case OrderStatus.NEW:
      return "default"
    case OrderStatus.PROCESSING:
      return "secondary"
    case OrderStatus.SHIPPED:
      return "outline"
    case OrderStatus.DELIVERED:
      return "success"
    case OrderStatus.RETURNED:
      return "destructive"
    case OrderStatus.CANCELLED:
      return "destructive"
    default:
      return "outline"
  }
}

const selectClass = cn(
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
)

export default async function OrdersPage() {
  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, quantity: true },
    }),
  ])

  const newCount = orders.filter((o) => o.status === OrderStatus.NEW).length
  const returnedCount = orders.filter((o) => o.status === OrderStatus.RETURNED).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đơn hàng</h1>
        <p className="text-sm text-muted-foreground">
          Đơn mới: {newCount} · Hoàn: {returnedCount} · Cập nhật trạng thái và vận đơn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo đơn mới</CardTitle>
          <CardDescription>
            Trừ tồn kho ngay khi tạo; trạng thái khởi tạo là «Mới»
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderCreateForm products={products} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách</TableHead>
                <TableHead>Kênh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tổng</TableHead>
                <TableHead>Cập nhật trạng thái</TableHead>
                <TableHead>Vận đơn</TableHead>
                <TableHead className="w-[120px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    Chưa có đơn
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">{o.orderCode}</TableCell>
                    <TableCell>{o.customerName ?? "—"}</TableCell>
                    <TableCell>{o.channel}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(o.status)}>
                        {statusLabels[o.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell>
                      {o.status === OrderStatus.RETURNED ||
                      o.status === OrderStatus.CANCELLED ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <form
                          action={updateOrderStatusForm.bind(null, o.id)}
                          className="flex max-w-[200px] items-center gap-1"
                        >
                          <label className="sr-only" htmlFor={`st-${o.id}`}>
                            Trạng thái đơn {o.orderCode}
                          </label>
                          <select
                            id={`st-${o.id}`}
                            name="status"
                            defaultValue={o.status}
                            className={selectClass}
                            aria-label={`Trạng thái ${o.orderCode}`}
                          >
                            {(
                              [
                                OrderStatus.NEW,
                                OrderStatus.PROCESSING,
                                OrderStatus.SHIPPED,
                                OrderStatus.DELIVERED,
                              ] as const
                            ).map((s) => (
                              <option key={s} value={s}>
                                {statusLabels[s]}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="secondary">
                            Lưu
                          </Button>
                        </form>
                      )}
                    </TableCell>
                    <TableCell>
                      <form
                        action={updateTrackingForm.bind(null, o.id)}
                        className="flex max-w-[220px] flex-col gap-1 sm:flex-row"
                      >
                        <Input
                          name="tracking"
                          defaultValue={o.trackingNumber ?? ""}
                          placeholder="Mã vận đơn"
                          className="h-9"
                          aria-label={`Vận đơn ${o.orderCode}`}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Lưu
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {o.status !== OrderStatus.RETURNED &&
                          o.status !== OrderStatus.CANCELLED && (
                            <form action={markOrderReturned.bind(null, o.id)}>
                              <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                Ghi hoàn
                              </Button>
                            </form>
                          )}
                        {o.status !== OrderStatus.CANCELLED &&
                          o.status !== OrderStatus.RETURNED &&
                          o.status !== OrderStatus.DELIVERED && (
                            <form action={cancelOrder.bind(null, o.id)}>
                              <Button
                                type="submit"
                                size="sm"
                                variant="ghost"
                                className="w-full text-destructive"
                              >
                                Hủy đơn
                              </Button>
                            </form>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {orders.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Chi tiết dòng hàng</p>
              <ul className="mt-2 space-y-3">
                {orders.map((o) => (
                  <li key={`detail-${o.id}`}>
                    <span className="font-mono">{o.orderCode}</span>:
                    <ul className="ml-4 mt-1 list-disc">
                      {o.items.map((it) => (
                        <li key={it.id}>
                          {it.product.name} × {it.quantity} @{" "}
                          {formatCurrency(it.price)}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
