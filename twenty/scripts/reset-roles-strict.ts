import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_FALSE = { view: false, create: false, edit: false, delete: false };

const TARGET_PERMISSIONS = {
    deals: ALL_FALSE,
    products: { view: true, create: false, edit: false, delete: false },
    counterparties: ALL_FALSE,
    settings: ALL_FALSE,
    users: ALL_FALSE,
};

async function main() {
    console.log('Resetting TEST role permissions to "ONLY PRODUCTS VIEW"...');
    await prisma.role.update({
        where: { name: 'TEST' },
        data: { permissions: TARGET_PERMISSIONS as any }
    });

    console.log('Resetting USER role permissions to ALL FALSE...');
    await prisma.role.update({
        where: { name: 'USER' },
        data: {
            permissions: {
                deals: ALL_FALSE,
                products: ALL_FALSE,
                counterparties: ALL_FALSE,
                settings: ALL_FALSE,
                users: ALL_FALSE,
            } as any
        }
    });

    console.log('Success.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
