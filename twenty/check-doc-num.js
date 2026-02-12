const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const latestDeal = await prisma.deal.findFirst();
    console.log('Latest Deal documentNumber:', latestDeal?.documentNumber);
    process.exit(0);
}

check();
