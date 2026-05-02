"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { createOrder } from "@/server/orders"

type ProductOption = {
  id: string
  name: string
  sku: string
  quantity: number
}

type OrderCreateFormProps = {
  products: ProductOption[]
}

const emptyLine = (): { productId: string; quantity: number } => ({
  productId: "",
  quantity: 1,
})

export const OrderCreateForm = ({ products }: OrderCreateFormProps) => {
  const [lines, setLines] = useState([emptyLine()])
  const [orderCode, setOrderCode] = useState("")
  const [channel, setChannel] = useState("Shopee")
  const [customerName, setCustomerName] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleAddLine = () => {
    setLines((prev) => [...prev, emptyLine()])
  }

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLineChange = (
    index: number,
    field: "productId" | "quantity",
    value: string | number,
  ) => {
    setLines((prev) => {
      const next = [...prev]
      const row = { ...next[index] }
      if (field === "productId") row.productId = String(value)
      if (field === "quantity") row.quantity = Math.max(1, Number(value) || 1)
      next[index] = row
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setPending(true)

    const items = lines
      .filter((l) => l.productId)
      .map((l) => ({ productId: l.productId, quantity: l.quantity }))

    const result = await createOrder({
      orderCode: orderCode.trim(),
      channel: channel.trim(),
      customerName: customerName.trim() || undefined,
      items,
    })

    setPending(false)
    if (!result.ok) {
      setMessage(result.error ?? "Không tạo được đơn")
      return
    }

    setOrderCode("")
    setCustomerName("")
    setLines([emptyLine()])
    setMessage("Đã tạo đơn")
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="orderCode">Mã đơn</Label>
          <Input
            id="orderCode"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            required
            placeholder="VD: DH-001"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="channel">Kênh bán</Label>
          <Input
            id="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            required
            placeholder="Shopee, TikTok..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Khách hàng</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Tuỳ chọn"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Dòng hàng</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
            <Plus className="size-4" aria-hidden />
            Thêm dòng
          </Button>
        </div>
        {lines.map((line, index) => (
          <div
            key={index}
            className="flex flex-wrap items-end gap-2 rounded-md border p-3"
          >
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Sản phẩm</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={line.productId}
                onChange={(e) => handleLineChange(index, "productId", e.target.value)}
                required={index === 0}
                aria-label={`Sản phẩm dòng ${index + 1}`}
              >
                <option value="">— Chọn —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (tồn {p.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs text-muted-foreground">SL</Label>
              <Input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) =>
                  handleLineChange(index, "quantity", e.target.value)
                }
                aria-label={`Số lượng dòng ${index + 1}`}
              />
            </div>
            {lines.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveLine(index)}
                aria-label={`Xóa dòng ${index + 1}`}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu..." : "Tạo đơn (trạng thái mới)"}
      </Button>
    </form>
  )
}
