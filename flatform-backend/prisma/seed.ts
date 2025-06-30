import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: 'admin', description: 'Admin hệ thống' },
      { name: 'client', description: 'Khách hàng mặc định' },
    ],
    skipDuplicates: true
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
