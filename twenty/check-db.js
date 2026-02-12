const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const templates = await prisma.documentTemplate.findMany();
    console.log('Templates found:', templates.length);
    templates.forEach(t => {
        console.log(`- ${t.name} (ID: ${t.id}): content length ${t.content?.length || 0}`);
    });
    const docs = await prisma.generatedDocument.findMany();
    console.log('Generated docs:', docs.length);
    process.exit(0);
}

check();
