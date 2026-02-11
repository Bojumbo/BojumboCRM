'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password || !name) {
        return { error: "Всі поля обов'язкові" };
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "Користувач з таким email вже існує" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: "USER",
                status: "PENDING",
            },
        });
        return { success: true };
    } catch {
        return { error: "Помилка при реєстрації" };
    }
}
