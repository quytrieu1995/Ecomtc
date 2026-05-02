"use server"

import { OrderStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().positive(),
})

const createOrderSchema = z.object({
  orderCode: z.string().min(1),
  channel: z.string().min(1),
  customerName: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export const createOrder = async (payload: z.infer<typeof createOrderSchema>) => {
  const parsed = createOrderSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false as const, error: "Đơn hàng không hợp lệ" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      let total = 0
      const lines: { productId: string; quantity: number; price: number }[] = []

      for (const line of parsed.data.items) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
        })
        if (!product) throw new Error("PRODUCT_MISSING")
        if (product.quantity < line.quantity) throw new Error("INSUFFICIENT")

        const lineTotal = product.price * line.quantity
        total += lineTotal
        lines.push({
          productId: product.id,
          quantity: line.quantity,
          price: product.price,
        })
      }

      const order = await tx.order.create({
        data: {
          orderCode: parsed.data.orderCode,
          status: OrderStatus.NEW,
          channel: parsed.data.channel,
          customerName: parsed.data.customerName ?? null,
          total,
        },
      })

      for (const line of lines) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: line.productId,
            quantity: line.quantity,
            price: line.price,
          },
        })
        await tx.product.update({
          where: { id: line.productId },
          data: { quantity: { decrement: line.quantity } },
        })
      }
    })

    revalidatePath("/orders")
    revalidatePath("/products")
    revalidatePath("/dashboard")
    return { ok: true as const }
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : ""
    if (code === "P2002") {
      return { ok: false as const, error: "Mã đơn đã tồn tại" }
    }
    const msg =
      e instanceof Error && e.message === "INSUFFICIENT"
        ? "Không đủ tồn kho"
        : "Không tạo được đơn — kiểm tra mã đơn hoặc sản phẩm"
    return { ok: false as const, error: msg }
  }
}

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })
  revalidatePath("/orders")
  revalidatePath("/dashboard")
}

export const updateOrderStatusForm = async (
  orderId: string,
  formData: FormData,
) => {
  const raw = formData.get("status")
  const status = Object.values(OrderStatus).find((s) => s === raw) as
    | OrderStatus
    | undefined
  if (!status) return
  await updateOrderStatus(orderId, status)
}

export const updateTrackingForm = async (orderId: string, formData: FormData) => {
  const tracking = String(formData.get("tracking") ?? "")
  await updateTracking(orderId, tracking)
}

export const updateTracking = async (orderId: string, trackingNumber: string) => {
  await prisma.order.update({
    where: { id: orderId },
    data: { trackingNumber: trackingNumber.trim() || null },
  })
  revalidatePath("/orders")
}

/** Dùng cho `<form action>` — kiểu trả về phải là void (Next.js 15). */
export const markOrderReturned = async (
  orderId: string,
  formData: FormData,
): Promise<void> => {
  void formData
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return
  if (order.status === OrderStatus.RETURNED) return
  if (order.status === OrderStatus.CANCELLED) return

  await prisma.$transaction(async (tx) => {
    for (const line of order.items) {
      await tx.product.update({
        where: { id: line.productId },
        data: { quantity: { increment: line.quantity } },
      })
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.RETURNED },
    })
  })

  revalidatePath("/orders")
  revalidatePath("/products")
  revalidatePath("/dashboard")
  revalidatePath("/reports")
}

/** Dùng cho `<form action>` — kiểu trả về phải là void (Next.js 15). */
export const cancelOrder = async (
  orderId: string,
  formData: FormData,
): Promise<void> => {
  void formData
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return
  if (order.status === OrderStatus.CANCELLED) return
  if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.RETURNED) {
    return
  }

  await prisma.$transaction(async (tx) => {
    for (const line of order.items) {
      await tx.product.update({
        where: { id: line.productId },
        data: { quantity: { increment: line.quantity } },
      })
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    })
  })

  revalidatePath("/orders")
  revalidatePath("/products")
  revalidatePath("/dashboard")
  revalidatePath("/reports")
}
