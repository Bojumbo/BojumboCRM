import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log(`Total users: ${users.length}`);
    users.forEach(u => console.log(`User: ${u.email}, ID: ${u.id}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
