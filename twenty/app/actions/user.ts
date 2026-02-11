'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getPendingUsers() {
    const session = await getServerSession(authOptions);


    return await prisma.user.findMany({
        where: {
            status: 'PENDING'
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getAllUsers() {
    const session = await getServerSession(authOptions);


    const users = await prisma.user.findMany({
        where: {
            status: {
                not: 'PENDING'
            }
        },
        include: {
            role: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    return users.map(u => ({
        ...u,
        role: u.role?.name || 'USER'
    }));
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'REJECTED') {
    const session = await getServerSession(authOptions);


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

export async function deleteUser(userId: string) {
    const session = await getServerSession(authOptions);


    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        console.error('Delete user error:', e);
        return { success: false, error: 'Failed to delete user' };
    }
}

export async function updateUserRole(userId: string, targetRoleName: string) {
    const session = await getServerSession(authOptions);


    try {
        const role = await prisma.role.findUnique({
            where: { name: targetRoleName }
        });

        if (!role) {
            throw new Error(`Role ${targetRoleName} not found`);
        }

        await prisma.user.update({
            where: { id: userId },
            data: { roleId: role.id }
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function logActivity() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return;

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { updatedAt: new Date() }
        });
        return { success: true };
    } catch {
        return { success: false };
    }
}
