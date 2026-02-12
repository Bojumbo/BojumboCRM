import { prisma } from "@/lib/prisma";
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error'); // Handle 'access_denied'

        if (error) {
            return NextResponse.redirect(`${url.origin}/admin/settings?error=${error}`);
        }

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        // 1. Get client config
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] }
            }
        });

        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;

        const oAuth2Client = new google.auth.OAuth2(
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_CLIENT_SECRET,
            redirectUri
        );

        // 2. Exchange code for tokens
        const { tokens } = await oAuth2Client.getToken(code);

        // 3. Save tokens
        if (tokens.access_token) {
            await prisma.systemSetting.upsert({
                where: { key: 'GOOGLE_ACCESS_TOKEN' },
                update: { value: tokens.access_token },
                create: { key: 'GOOGLE_ACCESS_TOKEN', value: tokens.access_token },
            });
        }

        if (tokens.refresh_token) {
            await prisma.systemSetting.upsert({
                where: { key: 'GOOGLE_REFRESH_TOKEN' },
                update: { value: tokens.refresh_token },
                create: { key: 'GOOGLE_REFRESH_TOKEN', value: tokens.refresh_token },
            });
        }

        // Also save expiry date if available
        if (tokens.expiry_date) {
            await prisma.systemSetting.upsert({
                where: { key: 'GOOGLE_TOKEN_EXPIRY' },
                update: { value: tokens.expiry_date.toString() },
                create: { key: 'GOOGLE_TOKEN_EXPIRY', value: tokens.expiry_date.toString() },
            });
        }

        console.log('Successfully authenticated with Google!');

        // 4. Redirect back to settings
        return NextResponse.redirect(`${url.origin}/admin/settings?success=true`);

    } catch (error: any) {
        console.error('Callback error:', error);
        return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
    }
}
