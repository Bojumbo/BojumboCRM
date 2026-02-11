import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Resource = 'deals' | 'products' | 'settings' | 'users' | 'counterparties';
export type Action = 'view' | 'create' | 'edit' | 'delete';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function hasPermission(resource: Resource, action: Action): Promise<boolean> {
    // Temporary bypass: allow everything
    return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function validatePermission(resource: Resource, action: Action) {
    // Temporary bypass: allow everything
    return;
}
