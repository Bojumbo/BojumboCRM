const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSave() {
    try {
        console.log('Testing save to SystemSetting...');
        await prisma.systemSetting.upsert({
            where: { key: 'TEST_KEY' },
            update: { value: 'TEST_VALUE' },
            create: { key: 'TEST_KEY', value: 'TEST_VALUE' }
        });
        console.log('✅ Save successful!');

        const check = await prisma.systemSetting.findUnique({ where: { key: 'TEST_KEY' } });
        console.log('Fetched value:', check.value);
    } catch (e) {
        console.error('❌ Save failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testSave();
