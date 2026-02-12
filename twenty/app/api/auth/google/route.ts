import { prisma } from "@/lib/prisma";
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] }
            }
        });

        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
            return NextResponse.json({ error: 'Missing Google Client configuration. Please visit Settings.' }, { status: 400 });
        }

        // Determine redirect URI dynamically based on request host is safer
        const url = new URL(request.url);
        const redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;

        const oAuth2Client = new google.auth.OAuth2(
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_CLIENT_SECRET,
            redirectUri
        );

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline', // IMPORTANT: Get refresh token
            scope: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            prompt: 'consent' // Force consent to ensure refresh token is returned
        });

        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
