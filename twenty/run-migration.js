const { execSync } = require('child_process');

// Run the migration using Prisma's executeRawUnsafe
async function runMigration() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        console.log('Starting migration...');

        // Drop content column if exists
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "DocumentTemplate" DROP COLUMN IF EXISTS "content";
        `);
        console.log('✓ Dropped content column from DocumentTemplate');

        // Add googleDocId column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "DocumentTemplate" ADD COLUMN IF NOT EXISTS "googleDocId" TEXT NOT NULL DEFAULT '';
        `);
        console.log('✓ Added googleDocId column to DocumentTemplate');

        // Add googleDocId to GeneratedDocument
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "GeneratedDocument" ADD COLUMN IF NOT EXISTS "googleDocId" TEXT;
        `);
        console.log('✓ Added googleDocId column to GeneratedDocument');

        // Add viewLink to GeneratedDocument
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "GeneratedDocument" ADD COLUMN IF NOT EXISTS "viewLink" TEXT;
        `);
        console.log('✓ Added viewLink column to GeneratedDocument');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();
