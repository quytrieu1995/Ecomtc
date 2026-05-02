import { getReportData } from "@/server/reports"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatNumber } from "@/lib/format"

export default async function ReportsPage() {
  const data = await getReportData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu, kênh, hoàn / hủy và sản phẩm
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Doanh thu (đơn không hủy / hoàn)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(data.revenueConfirmed)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đơn hoàn</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatNumber(data.returnCount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đơn hủy</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatNumber(data.cancelCount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SLSP hoàn / hủy (dòng đơn)</CardDescription>
            <CardTitle className="text-sm font-normal leading-relaxed">
              Hoàn: {formatNumber(data.returnedUnits)} · Hủy:{" "}
              {formatNumber(data.cancelledUnits)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList>
          <TabsTrigger value="channels">Kênh bán</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
        </TabsList>
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu & số đơn theo kênh</CardTitle>
              <CardDescription>Tổng giá trị đơn theo trường kênh</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kênh</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead className="text-right">Số đơn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.channels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Chưa có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.channels.map((c) => (
                      <TableRow key={c.channel}>
                        <TableCell>{c.channel}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(c.revenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(c.orders)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm</CardTitle>
              <CardDescription>
                Tồn, đã bán (đơn hiệu lực), hoàn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-right">Tồn</TableHead>
                    <TableHead className="text-right">Đã bán</TableHead>
                    <TableHead className="text-right">Hoàn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        Chưa có sản phẩm
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.productReport.map((p) => (
                      <TableRow key={p.sku}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(p.stock)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(p.sold)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(p.returned)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
