'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CounterpartyType } from '@prisma/client';

export async function getCounterparties() {
    return await prisma.counterparty.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function getCounterparty(id: string) {
    return await prisma.counterparty.findUnique({
        where: { id },
        include: {
            deals: true,
        },
    });
}

export async function createCounterparty(data: {
    type: CounterpartyType;
    name: string;
    taxId?: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
}) {
    try {
        const counterparty = await prisma.counterparty.create({
            data,
        });
        revalidatePath('/counterparties');
        return { success: true, data: JSON.parse(JSON.stringify(counterparty)) };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to create counterparty' };
    }
}

export async function updateCounterparty(id: string, data: {
    type?: CounterpartyType;
    name?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
}) {
    try {
        const counterparty = await prisma.counterparty.update({
            where: { id },
            data,
        });
        revalidatePath('/counterparties');
        return { success: true, data: JSON.parse(JSON.stringify(counterparty)) };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update counterparty' };
    }
}

export async function deleteCounterparty(id: string) {
    try {
        await prisma.counterparty.delete({
            where: { id },
        });
        revalidatePath('/counterparties');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to delete counterparty' };
    }
}
