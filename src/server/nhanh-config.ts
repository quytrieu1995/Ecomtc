"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export const getNhanhConfig = async () => {
  const row = await prisma.nhanhConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  })
  return row
}

export const saveNhanhConfig = async (formData: FormData) => {
  const appKey = String(formData.get("appKey") ?? "").trim()
  const businessId = String(formData.get("businessId") ?? "").trim()

  if (!appKey || !businessId) {
    return { ok: false as const, error: "AppKey và BusinessId là bắt buộc" }
  }

  const existing = await prisma.nhanhConfig.findFirst()
  if (existing) {
    await prisma.nhanhConfig.update({
      where: { id: existing.id },
      data: { appKey, businessId },
    })
  } else {
    await prisma.nhanhConfig.create({ data: { appKey, businessId } })
  }

  revalidatePath("/settings")
  return { ok: true as const }
}
