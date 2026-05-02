import { OrderStatus, MovementType } from "@prisma/client"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const main = async () => {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.product.deleteMany()
  const a = await prisma.product.create({
    data: {
      name: "Áo thun basic",
      sku: "AT-BASIC-01",
      price: 199000,
      quantity: 80,
      minStock: 10,
    },
  })
  const b = await prisma.product.create({
    data: {
      name: "Quần jean slim",
      sku: "QJ-SLIM-02",
      price: 450000,
      quantity: 40,
      minStock: 5,
    },
  })

  await prisma.stockMovement.create({
    data: {
      type: MovementType.INBOUND,
      productId: a.id,
      quantity: 80,
      note: "Nhập mở kho",
    },
  })

  const order = await prisma.order.create({
    data: {
      orderCode: "DH-SEED-1",
      status: OrderStatus.NEW,
      channel: "Shopee",
      customerName: "Nguyễn A",
      total: a.price * 2,
    },
  })
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: a.id,
      quantity: 2,
      price: a.price,
    },
  })
  await prisma.product.update({
    where: { id: a.id },
    data: { quantity: a.quantity - 2 },
  })

  console.log("Seed OK:", { b: b.sku })
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
