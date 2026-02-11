'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
    return await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
    });
}

export async function getProduct(id: string) {
    return await prisma.product.findUnique({
        where: { id },
    });
}

export async function createProduct(data: { name: string; sku?: string; description?: string; defaultPrice: number }) {
    try {
        const product = await prisma.product.create({
            data,
        });
        revalidatePath('/products');
        revalidatePath('/deals');
        return { success: true, data: JSON.parse(JSON.stringify(product)) };
    } catch {
        return { success: false, error: 'Failed to create product' };
    }
}

export async function updateProduct(id: string, data: { name?: string; sku?: string; description?: string; defaultPrice?: number }) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data,
        });
        revalidatePath('/products');
        revalidatePath('/deals');
        return { success: true, data: JSON.parse(JSON.stringify(product)) };
    } catch {
        return { success: false, error: 'Failed to update product' };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        });
        revalidatePath('/products');
        revalidatePath('/deals');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to delete product' };
    }
}
