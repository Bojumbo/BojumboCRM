const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Running migration: Add googleDriveFolderId to DocumentTemplate...');

    try {
        await prisma.$executeRaw`ALTER TABLE "DocumentTemplate" ADD COLUMN "googleDriveFolderId" TEXT;`;
        console.log('Migration successful!');
    } catch (e) {
        if (e.message.includes('column "googleDriveFolderId" of relation "DocumentTemplate" already exists')) {
            console.log('Column already exists, skipping migration.');
        } else {
            console.error('Migration failed:', e);
            process.exit(1);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
