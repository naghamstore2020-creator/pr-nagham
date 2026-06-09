import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction([
    prisma.aiMatch.deleteMany(),
    prisma.inventoryLog.deleteMany(),
    prisma.pricingLog.deleteMany(),
    prisma.job.deleteMany(),
  ]);
  const count = await prisma.job.count();
  console.log(`تم التصفير. عدد الوظائف المتبقية: ${count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
