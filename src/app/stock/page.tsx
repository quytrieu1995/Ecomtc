import { prisma } from "@/lib/prisma"
import { MovementType } from "@prisma/client"
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"
import { createStockMovement } from "@/server/stock"

const typeLabels: Record<MovementType, string> = {
  [MovementType.INBOUND]: "Nhập kho",
  [MovementType.OUTBOUND]: "Xuất kho",
  [MovementType.WRITE_OFF]: "Xuất hủy",
}

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
)

export default async function StockPage() {
  const [products, movements] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Xuất / nhập kho</h1>
        <p className="text-sm text-muted-foreground">
          Nhập kho, xuất bán hoặc xuất hủy; lịch sử hiển thị bên dưới
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo phiếu</CardTitle>
          <CardDescription>Chọn sản phẩm, loại và số lượng</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createStockMovement}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
          >
            <div className="space-y-2 lg:col-span-4">
              <Label htmlFor="productId">Sản phẩm</Label>
              <select
                id="productId"
                name="productId"
                required
                className={selectClass}
                aria-label="Chọn sản phẩm"
              >
                <option value="">— Chọn —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — tồn {formatNumber(p.quantity)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="type">Loại phiếu</Label>
              <select
                id="type"
                name="type"
                required
                className={selectClass}
                defaultValue={MovementType.INBOUND}
                aria-label="Loại phiếu"
              >
                <option value={MovementType.INBOUND}>
                  {typeLabels[MovementType.INBOUND]}
                </option>
                <option value={MovementType.OUTBOUND}>
                  {typeLabels[MovementType.OUTBOUND]}
                </option>
                <option value={MovementType.WRITE_OFF}>
                  {typeLabels[MovementType.WRITE_OFF]}
                </option>
              </select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="quantity">Số lượng</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={1}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input id="note" name="note" placeholder="Tuỳ chọn" />
            </div>
            <div className="lg:col-span-1">
              <Button type="submit" className="w-full">
                Ghi nhận
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Chưa có phiếu
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(m.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>{typeLabels[m.type]}</TableCell>
                    <TableCell>
                      {m.product.name}{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        {m.product.sku}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(m.quantity)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {m.note ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
