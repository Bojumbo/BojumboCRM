import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { role: true }
    });
    console.log('Current Users in DB:');
    users.forEach(u => {
        console.log(`User: ${u.email}, RoleId: ${u.roleId}, Role Name: ${u.role?.name}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
