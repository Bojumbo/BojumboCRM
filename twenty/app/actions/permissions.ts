'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface RolePermissions {
    [role: string]: {
        [resource: string]: {
            view: boolean;
            create: boolean;
            edit: boolean;
            delete: boolean;
        }
    }
}

// Default permissions for new roles
const DEFAULT_RESOURCE_PERMISSIONS = {
    deals: { view: false, create: false, edit: false, delete: false },
    products: { view: false, create: false, edit: false, delete: false },
    counterparties: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
};

export async function getPermissions(): Promise<RolePermissions> {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const roles = await prisma.role.findMany();
    const permissions: RolePermissions = {};

    roles.forEach(role => {
        // Deep merge with defaults to ensure new resources are visible in UI
        const rolePerms = (role.permissions as any) || {};
        const merged: any = JSON.parse(JSON.stringify(DEFAULT_RESOURCE_PERMISSIONS));

        Object.keys(merged).forEach(resource => {
            if (rolePerms[resource]) {
                merged[resource] = { ...merged[resource], ...rolePerms[resource] };
            }
        });

        permissions[role.name] = merged;
    });

    return permissions;
}

export async function getMyPermissions(): Promise<{ [resource: string]: { view: boolean; create: boolean; edit: boolean; delete: boolean } } | null> {
    const full = { view: true, create: true, edit: true, delete: true };
    return {
        deals: full,
        products: full,
        counterparties: full,
        settings: full,
        users: full
    };
}

export async function createRole(roleName: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized');

    roleName = roleName.trim().toUpperCase();
    if (!roleName) throw new Error('Role name required');

    const existing = await prisma.role.findUnique({
        where: { name: roleName }
    });

    if (existing) throw new Error('Role already exists');

    await prisma.role.create({
        data: {
            name: roleName,
            permissions: DEFAULT_RESOURCE_PERMISSIONS as any
        }
    });

    revalidatePath('/admin/users');
    return { success: true };
}

export async function deleteRole(roleName: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized');

    if (['USER', 'ADMIN'].includes(roleName)) {
        throw new Error('Cannot delete system roles');
    }

    const role = await prisma.role.findUnique({
        where: { name: roleName }
    });

    if (!role) throw new Error('Role not found');

    // Reassign users to USER role before deleting
    const defaultRole = await prisma.role.findUnique({
        where: { name: 'USER' }
    });

    if (defaultRole) {
        await prisma.user.updateMany({
            where: { roleId: role.id },
            data: { roleId: defaultRole.id }
        });
    }

    await prisma.role.delete({
        where: { id: role.id }
    });

    revalidatePath('/admin/users');
    return { success: true };
}

export async function updatePermissions(newPermissions: RolePermissions) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Update each role in the database
    for (const [roleName, perms] of Object.entries(newPermissions)) {
        await prisma.role.update({
            where: { name: roleName },
            data: { permissions: perms as any }
        });
    }

    revalidatePath('/admin/users');
    return { success: true };
}
