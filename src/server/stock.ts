"use server"

import { MovementType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.nativeEnum(MovementType),
  quantity: z.coerce.number().int().positive(),
  note: z.string().optional(),
})

export const createStockMovement = async (formData: FormData) => {
  const parsed = movementSchema.safeParse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    note: formData.get("note") || undefined,
  })

  if (!parsed.success) {
    return { ok: false as const, error: "Dữ liệu không hợp lệ" }
  }

  const { productId, type, quantity, note } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: productId },
      })

      let delta = 0
      if (type === MovementType.INBOUND) delta = quantity
      if (type === MovementType.OUTBOUND || type === MovementType.WRITE_OFF) {
        delta = -quantity
      }

      const nextQty = product.quantity + delta
      if (nextQty < 0) {
        throw new Error("INSUFFICIENT_STOCK")
      }

      await tx.product.update({
        where: { id: productId },
        data: { quantity: nextQty },
      })

      await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          note: note ?? null,
        },
      })
    })
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return { ok: false as const, error: "Không đủ tồn kho để xuất" }
    }
    return { ok: false as const, error: "Không ghi nhận được phiếu" }
  }

  revalidatePath("/stock")
  revalidatePath("/products")
  revalidatePath("/dashboard")
  return { ok: true as const }
}
