const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const settings = await prisma.systemSetting.findMany();
    console.log('Settings in database:');
    settings.forEach(s => {
        const displayValue = s.key.includes('SECRET') || s.key.includes('TOKEN') ? '********' : s.value;
        console.log(`- ${s.key}: ${displayValue}`);
    });
    await prisma.$disconnect();
}

check();
