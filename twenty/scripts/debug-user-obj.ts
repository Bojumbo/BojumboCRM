import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // @ts-ignore
    const user = await prisma.user.findFirst();
    console.log('User object keys:', Object.keys(user || {}));
    console.log('User object sample:', JSON.stringify(user, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
