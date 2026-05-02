"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  sku: z.string().min(1, "SKU không được để trống"),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
})

export const createProduct = async (formData: FormData) => {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    minStock: formData.get("minStock"),
  })

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.product.create({ data: parsed.data })
    revalidatePath("/products")
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "SKU có thể đã tồn tại" }
  }
}

export const updateProduct = async (id: string, formData: FormData) => {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    minStock: formData.get("minStock"),
  })

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: parsed.data,
    })
    revalidatePath("/products")
    redirect("/products")
  } catch {
    return { ok: false as const, error: "Không cập nhật được" }
  }
}

export const deleteProduct = async (id: string, _formData: FormData) => {
  await prisma.product.delete({ where: { id } })
  revalidatePath("/products")
}
