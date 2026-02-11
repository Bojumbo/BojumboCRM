import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_FALSE = {
    view: false,
    create: false,
    edit: false,
    delete: false,
};

const DEFAULT_RESOURCE_PERMISSIONS = {
    deals: ALL_FALSE,
    products: ALL_FALSE,
    counterparties: ALL_FALSE,
    settings: ALL_FALSE,
    users: ALL_FALSE,
};

async function main() {
    console.log('Resetting USER role permissions to all false...');
    await prisma.role.update({
        where: { name: 'USER' },
        data: { permissions: DEFAULT_RESOURCE_PERMISSIONS as any }
    });
    console.log('Success.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
