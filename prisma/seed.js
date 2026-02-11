// Gilabun: default seating template + optional runtime tables.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Default template layout (tableNumber, seats, grid x, y -> pixel x,y,w,h)
const CELL = 80;
const GILABUN_TEMPLATE_TABLES = [
  { tableNumber: 1, seats: 8, x: 2, y: 0, w: 160, h: 130 },
  { tableNumber: 2, seats: 8, x: 3, y: 0, w: 160, h: 130 },
  { tableNumber: 3, seats: 8, x: 4, y: 0, w: 160, h: 130 },
  { tableNumber: 4, seats: 4, x: 3, y: 1, w: 110, h: 110 },
  { tableNumber: 5, seats: 8, x: 4, y: 2, w: 160, h: 130 },
  { tableNumber: 6, seats: 4, x: 3, y: 2, w: 110, h: 110 },
  { tableNumber: 8, seats: 2, x: 2, y: 4, w: 90, h: 90 },
  { tableNumber: 9, seats: 2, x: 3, y: 4, w: 90, h: 90 },
  { tableNumber: 10, seats: 2, x: 4, y: 4, w: 90, h: 90 },
  { tableNumber: 11, seats: 2, x: 5, y: 4, w: 90, h: 90 },
  { tableNumber: 12, seats: 2, x: 6, y: 4, w: 90, h: 90 },
  { tableNumber: 13, seats: 2, x: 7, y: 4, w: 90, h: 90 },
  { tableNumber: 15, seats: 4, x: 3, y: 6, w: 110, h: 110 },
  { tableNumber: 16, seats: 4, x: 4, y: 6, w: 110, h: 110 },
  { tableNumber: 17, seats: 4, x: 5, y: 6, w: 110, h: 110 },
  { tableNumber: 18, seats: 5, x: 6, y: 6, w: 130, h: 110 },
  { tableNumber: 19, seats: 5, x: 7, y: 6, w: 130, h: 110 },
  { tableNumber: 20, seats: 4, x: 5, y: 7, w: 110, h: 110 }
].map((t) => ({
  ...t,
  x: t.x * CELL,
  y: t.y * CELL
}));

async function main() {
  const templateCount = await prisma.seatingTemplate.count();
  if (templateCount > 0) {
    console.log("Seating templates already exist. Skipping seed.");
    return;
  }

  const template = await prisma.seatingTemplate.create({
    data: {
      name: "Gilabun",
      isDefault: true
    }
  });

  await prisma.templateTable.createMany({
    data: GILABUN_TEMPLATE_TABLES.map((t) => ({
      templateId: template.id,
      tableNumber: t.tableNumber,
      seats: t.seats,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h
    }))
  });

  console.log(`Seeded template "${template.name}" with ${GILABUN_TEMPLATE_TABLES.length} tables.`);

  // Sync runtime Table rows from default template so service mode works
  const defaultTemplate = await prisma.seatingTemplate.findUnique({
    where: { id: template.id },
    include: { items: true }
  });
  if (defaultTemplate?.items?.length > 0) {
    const existingNumbers = new Set(
      (await prisma.table.findMany({ select: { number: true } })).map((t) => t.number)
    );
    for (const item of defaultTemplate.items) {
      if (existingNumbers.has(item.tableNumber)) {
        await prisma.table.updateMany({
          where: { number: item.tableNumber },
          data: { capacity: item.seats, label: String(item.tableNumber) }
        });
      } else {
        await prisma.table.create({
          data: {
            number: item.tableNumber,
            label: String(item.tableNumber),
            capacity: item.seats,
            zone: "MAIN"
          }
        });
      }
    }
    const templateNumbers = new Set(defaultTemplate.items.map((i) => i.tableNumber));
    await prisma.table.deleteMany({
      where: { number: { notIn: [...templateNumbers] } }
    });
    console.log("Synced runtime tables from default template.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
