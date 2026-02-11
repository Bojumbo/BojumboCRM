'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DealProduct } from '@prisma/client';

export async function getDealsByPipeline(pipelineId: string) {
    try {
        return await prisma.deal.findMany({
            where: {
                stage: {
                    pipelineId: pipelineId,
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                stage: true,
                managers: true,
                counterparty: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    }
                }
            },
        });
    } catch {
        return [];
    }
}

export async function getDealDetails(id: string) {
    return await prisma.deal.findUnique({
        where: { id },
        include: {
            comments: {
                orderBy: { createdAt: 'desc' },
            },
            counterparty: true,
            products: {
                include: {
                    product: true,
                },
            },
            managers: true,
        },
    });
}

export async function updateDeal(id: string, data: {
    title?: string;
    description?: string;
    amount?: number;
    counterpartyId?: string | null;
    managerIds?: string[];
}) {
    try {
        const { managerIds, ...rest } = data;

        const deal = await prisma.deal.update({
            where: { id },
            data: {
                ...rest,
                ...(managerIds && {
                    managers: {
                        set: managerIds.map(mid => ({ id: mid }))
                    }
                })
            },
        });
        revalidatePath('/deals');
        return { success: true, data: JSON.parse(JSON.stringify(deal)) };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update deal' };
    }
}

export async function updateDealStage(dealId: string, stageId: string) {
    try {
        await prisma.deal.update({
            where: { id: dealId },
            data: {
                stageId: stageId,
            },
        });
        revalidatePath('/deals');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to update deal stage' };
    }
}

export async function createDeal(title: string, amount: number, stageId: string) {
    try {
        const deal = await prisma.deal.create({
            data: {
                title,
                amount,
                stageId,
                status: 'OPEN',
            },
        });
        revalidatePath('/deals');
        return { success: true, data: JSON.parse(JSON.stringify(deal)) };
    } catch {
        return { success: false, error: 'Failed to create deal' };
    }
}

export async function deleteDeal(id: string) {
    try {
        await prisma.deal.delete({
            where: { id },
        });
        revalidatePath('/deals');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to delete deal' };
    }
}

// Comment Actions
export async function addComment(dealId: string, content: string) {
    try {
        const comment = await prisma.comment.create({
            data: {
                dealId,
                content,
            },
        });
        revalidatePath('/deals');
        return { success: true, data: JSON.parse(JSON.stringify(comment)) };
    } catch {
        return { success: false, error: 'Failed to add comment' };
    }
}

// DealProduct Actions
export async function addDealProduct(dealId: string, productId: string, quantity: number, price: number) {
    try {
        const dp = await prisma.dealProduct.create({
            data: {
                dealId,
                productId,
                quantity,
                priceAtSale: price,
            },
        });

        await updateDealTotalAmount(dealId);

        revalidatePath('/deals');
        return { success: true, data: JSON.parse(JSON.stringify(dp)) };
    } catch {
        return { success: false, error: 'Failed to add product to deal' };
    }
}

export async function updateDealProduct(id: string, data: { quantity?: number; priceAtSale?: number }) {
    try {
        const dp = await prisma.dealProduct.update({
            where: { id },
            data,
        });
        await updateDealTotalAmount(dp.dealId);
        revalidatePath('/deals');
        return { success: true, data: JSON.parse(JSON.stringify(dp)) };
    } catch {
        return { success: false, error: 'Failed to update deal product' };
    }
}

export async function removeDealProduct(id: string) {
    try {
        const dp = await prisma.dealProduct.delete({
            where: { id },
        });
        await updateDealTotalAmount(dp.dealId);
        revalidatePath('/deals');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to remove deal product' };
    }
}

async function updateDealTotalAmount(dealId: string) {
    const products = await prisma.dealProduct.findMany({
        where: { dealId },
    });

    const total = products.reduce((acc: number, curr: DealProduct) => {
        return acc + (Number(curr.priceAtSale) * curr.quantity);
    }, 0);

    await prisma.deal.update({
        where: { id: dealId },
        data: { amount: total },
    });
}
