import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check(userId: string) {
    console.log(`Simulating hasPermission for user ID: ${userId}`);
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`User found: ${user.email}, Role: ${user.role?.name}`);
    console.log(`Permissions JSON: ${JSON.stringify(user.role?.permissions, null, 2)}`);

    const resource = 'deals';
    const action = 'view';

    if (user.role?.name === 'ADMIN') {
        console.log('User is ADMIN, returning true');
        return;
    }

    const permissions = user.role?.permissions as any;
    if (!permissions) {
        console.log('No permissions found');
        return;
    }

    const resourcePerms = permissions[resource];
    console.log(`Resource perms for ${resource}: ${JSON.stringify(resourcePerms)}`);

    const result = resourcePerms?.[action] === true;
    console.log(`Result for ${resource}:${action} -> ${result}`);
}

main()
async function main() {
    await check("cmli5xjqq000hdg0a39bq7e9m"); // bogdanbrodiak2@gmail.com
}
