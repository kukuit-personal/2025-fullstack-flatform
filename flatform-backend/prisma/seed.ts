import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1) Seed roles
  await prisma.role.createMany({
    data: [
      { name: 'admin', description: 'Admin hệ thống' },
      { name: 'client', description: 'Khách hàng mặc định' },
    ],
    skipDuplicates: true,
  });

  // --- Seed status (chung toàn hệ thống) ---
  const systemStatuses = [
    { id: 0, status: 'disabled' },
    { id: 1, status: 'active' },
    { id: 2, status: 'temp' },
  ];

  for (const s of systemStatuses) {
    await prisma.status.upsert({
      where: { id: s.id },
      create: s,
      update: { status: s.status },
    });
  }

  // 2) Seed email_tp_status
  const tpStatuses = [
    { id: 0, status: 'disabled' },
    { id: 1, status: 'active' },
    { id: 2, status: 'draft' },
    { id: 3, status: 'private' },
    { id: 4, status: 'published' },
    { id: 5, status: 'archived' },
    { id: 6, status: 'progress_to_store' },
    { id: 7, status: 'in_store' },
    { id: 8, status: 'removed_from_store' },
  ] as const;

  for (const s of tpStatuses) {
    await prisma.emailTpStatus.upsert({
      where: { id: s.id },
      create: s,
      update: { status: s.status }, // nếu muốn đổi tên, lần sau chạy seed sẽ cập nhật
    });
  }

  console.log('✅ Seeded role & email_tp_status');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
