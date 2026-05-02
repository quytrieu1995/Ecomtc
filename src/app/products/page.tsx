import Link from "next/link"
import { prisma } from "@/lib/prisma"
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
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/format"
import { createProduct, deleteProduct } from "@/server/products"
import { Pencil, Trash2 } from "lucide-react"

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Tên, SKU, giá, tồn kho và ngưỡng tối thiểu
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm sản phẩm</CardTitle>
          <CardDescription>Nhập thông tin và lưu vào kho nội bộ</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Tên</Label>
              <Input id="name" name="name" required placeholder="Tên sản phẩm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" required placeholder="Mã SKU" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá (VNĐ)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Tồn kho</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Tồn tối thiểu</Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={0}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto">
                Lưu sản phẩm
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="text-right">Tồn</TableHead>
                <TableHead className="text-right">Tồn tối thiểu</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Chưa có sản phẩm
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
                  const low = p.quantity <= p.minStock
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {low ? (
                          <Badge variant="destructive">{formatNumber(p.quantity)}</Badge>
                        ) : (
                          <span className="tabular-nums">{formatNumber(p.quantity)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(p.minStock)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="icon" asChild>
                            <Link
                              href={`/products/${p.id}`}
                              aria-label={`Sửa ${p.name}`}
                            >
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <form action={deleteProduct.bind(null, p.id)}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              aria-label={`Xóa ${p.name}`}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
