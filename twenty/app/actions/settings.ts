'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSystemSetting(key: string, value: string) {
    try {
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error('Error saving setting:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getSystemSetting(key: string) {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key }
        });
        return setting?.value || null;
    } catch (error) {
        console.error('Error fetching setting:', error);
        return null;
    }
}

export async function getAllSettings() {
    try {
        const settings = await prisma.systemSetting.findMany();
        // Convert array to object
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
    } catch (error) {
        console.error('Error fetching all settings:', error);
        return {};
    }
}
