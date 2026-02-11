'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getPendingUsers() {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    return await prisma.user.findMany({
        where: {
            status: 'PENDING'
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'REJECTED') {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { status }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch {
        return { success: false, error: 'Failed to update user status' };
    }
}
