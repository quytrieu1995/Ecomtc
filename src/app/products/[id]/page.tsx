import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProduct } from "@/server/products"
import { ArrowLeft } from "lucide-react"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  const action = updateProduct.bind(null, id)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products" aria-label="Quay lại danh sách">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sửa sản phẩm</h1>
          <p className="text-sm text-muted-foreground">{product.sku}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin</CardTitle>
          <CardDescription>Cập nhật và lưu thay đổi</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên</Label>
              <Input id="name" name="name" required defaultValue={product.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" required defaultValue={product.sku} />
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
                defaultValue={product.price}
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
                defaultValue={product.quantity}
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
                defaultValue={product.minStock}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Lưu</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/products">Hủy</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
