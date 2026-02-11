import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.role.findMany();
    console.log('Current Roles in DB:');
    roles.forEach(role => {
        console.log(`Role: ${role.name}`);
        console.log(`Permissions: ${JSON.stringify(role.permissions, null, 2)}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
