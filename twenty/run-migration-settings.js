const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Running migration: Create SystemSetting table...');

    try {
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "SystemSetting" (
                "key" TEXT NOT NULL,
                "value" TEXT NOT NULL,
                CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
            );
        `;
        console.log('Migration successful!');
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
