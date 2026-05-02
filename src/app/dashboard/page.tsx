import { getDashboardStats } from "@/server/dashboard"
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
import { formatCurrency, formatNumber } from "@/lib/format"
import { AlertTriangle } from "lucide-react"

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Tồn kho, đơn mới và sản phẩm bán chạy
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng đơn vị tồn</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatNumber(stats.totalStockUnits)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Giá trị tồn kho (ước tính)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatCurrency(stats.inventoryValue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đơn hàng mới</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatNumber(stats.newOrders)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              {stats.lowStockCount > 0 && (
                <AlertTriangle className="size-4 text-amber-600" aria-hidden />
              )}
              SKU dưới mức tối thiểu
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatNumber(stats.lowStockCount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top sản phẩm bán (theo số lượng đã bán)</CardTitle>
          <CardDescription>Tính từ các dòng đơn hàng trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Đã bán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Chưa có dữ liệu bán hàng
                  </TableCell>
                </TableRow>
              ) : (
                stats.topProducts.map((row) => (
                  <TableRow key={row.sku}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="font-mono text-sm">{row.sku}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.sold)}
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
