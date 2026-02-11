'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPipelines() {
    return await prisma.pipeline.findMany({
        include: {
            stages: {
                orderBy: {
                    orderIndex: 'asc',
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    });
}

export async function createPipeline(name: string) {
    try {
        const pipeline = await prisma.pipeline.create({
            data: {
                name,
                stages: {
                    create: [
                        { name: 'New', color: '#3b82f6', orderIndex: 0 },
                        { name: 'Won', color: '#10b981', orderIndex: 1 },
                    ],
                },
            },
        });
        revalidatePath('/settings/pipelines');
        return { success: true, data: pipeline };
    } catch {
        return { success: false, error: 'Failed to create pipeline' };
    }
}

export async function deletePipeline(id: string) {
    try {
        await prisma.stage.deleteMany({
            where: { pipelineId: id },
        });
        await prisma.pipeline.delete({
            where: { id },
        });
        revalidatePath('/settings/pipelines');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to delete pipeline' };
    }
}

export async function updatePipeline(id: string, name: string) {
    try {
        await prisma.pipeline.update({
            where: { id },
            data: { name },
        });
        revalidatePath('/settings/pipelines');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to update pipeline' };
    }
}

export async function addStage(pipelineId: string, name: string) {
    try {
        const lastStage = await prisma.stage.findFirst({
            where: { pipelineId },
            orderBy: { orderIndex: 'desc' },
        });
        const newOrderIndex = (lastStage?.orderIndex ?? -1) + 1;

        await prisma.stage.create({
            data: {
                pipelineId,
                name,
                orderIndex: newOrderIndex,
                color: '#94a3b8', // default gray
            },
        });
        revalidatePath('/settings/pipelines');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to add stage' };
    }
}

export async function updateStage(id: string, data: { name?: string; color?: string; orderIndex?: number }) {
    try {
        await prisma.stage.update({
            where: { id },
            data,
        });
        revalidatePath('/settings/pipelines');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to update stage' };
    }
}

export async function deleteStage(id: string) {
    try {
        await prisma.stage.delete({
            where: { id },
        });
        revalidatePath('/settings/pipelines');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to delete stage' };
    }
}

export async function reorderStages(pipelineId: string, stages: { id: string; orderIndex: number }[]) {
    try {
        await prisma.$transaction(
            stages.map((stage) =>
                prisma.stage.update({
                    where: { id: stage.id },
                    data: { orderIndex: stage.orderIndex },
                })
            )
        );
        revalidatePath('/settings/pipelines');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to reorder stages' };
    }
}
