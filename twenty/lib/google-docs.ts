import { google } from 'googleapis';
import { prisma } from "@/lib/prisma";

// Remove file imports as we use DB now
// import * as fs from 'fs';
// import * as path from 'path';

/**
 * Get authenticated Google client using saved OAuth tokens
 */
export async function getGoogleAuth() {
    try {
        // Fetch all required settings in one go
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: [
                        'GOOGLE_CLIENT_ID',
                        'GOOGLE_CLIENT_SECRET',
                        'GOOGLE_ACCESS_TOKEN',
                        'GOOGLE_REFRESH_TOKEN',
                        'GOOGLE_TOKEN_EXPIRY'
                    ]
                }
            }
        });

        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.GOOGLE_REFRESH_TOKEN) {
            throw new Error('Google Integration not configured. Please visit Settings page.');
        }

        const oAuth2Client = new google.auth.OAuth2(
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_CLIENT_SECRET
        );

        oAuth2Client.setCredentials({
            refresh_token: config.GOOGLE_REFRESH_TOKEN,
            access_token: config.GOOGLE_ACCESS_TOKEN,
            expiry_date: config.GOOGLE_TOKEN_EXPIRY ? parseInt(config.GOOGLE_TOKEN_EXPIRY) : undefined,
            // We can add forceRefresh logic if needed, but the library handles it mostly
        });

        // Listen for token updates (refresh) and save them back to DB
        oAuth2Client.on('tokens', async (tokens) => {
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
            if (tokens.expiry_date) {
                await prisma.systemSetting.upsert({
                    where: { key: 'GOOGLE_TOKEN_EXPIRY' },
                    update: { value: tokens.expiry_date.toString() },
                    create: { key: 'GOOGLE_TOKEN_EXPIRY', value: tokens.expiry_date.toString() },
                });
            }
        });

        return oAuth2Client;
    } catch (error) {
        console.error('Error authenticate Google:', error);
        throw new Error('Failed to authenticate with Google. Please check Settings.');
    }
}

/**
 * Create a copy of a Google Doc template
 */
export async function copyTemplate(templateId: string, newTitle: string, folderId?: string) {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth: auth as any });

    try {
        // First, verify the template exists and we have access
        await drive.files.get({
            fileId: templateId,
            fields: 'id,name,mimeType,permissions',
        });

        // Create the copy
        const requestBody: any = {
            name: newTitle,
        };

        // If folderId is provided, save to that folder
        if (folderId) {
            requestBody.parents = [folderId];
        }

        const response = await drive.files.copy({
            fileId: templateId,
            requestBody,
            supportsAllDrives: true,
        });

        return response.data.id;
    } catch (error: any) {
        console.error('Error copying template:', error);

        if (error.code === 404) {
            throw new Error(
                `Template not found (ID: ${templateId}). ` +
                `Please verify: 1) The Google Doc ID is correct, 2) The Service Account has "Editor" access to this document. ` +
                `Check GOOGLE_DOCS_SETUP.md for instructions.`
            );
        }

        if (error.code === 403) {
            // Check if it's a storage quota issue
            if (error.message?.includes('quota') || error.message?.includes('storage')) {
                throw new Error(
                    `Storage quota exceeded. Please provide a folder ID in your personal Google Drive to save generated documents. ` +
                    `See GOOGLE_DOCS_SETUP.md for instructions on setting up a destination folder.`
                );
            }

            throw new Error(
                `Access denied to template (ID: ${templateId}). ` +
                `Please share the document with your Service Account email (check bojumbocrm-ed53600525ac.json for "client_email") ` +
                `and grant "Editor" permissions.`
            );
        }

        throw new Error(`Failed to copy template: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Replace variables in a Google Doc
 */
export async function replaceVariablesInDoc(documentId: string, variables: Record<string, string>) {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth: auth as any });

    // Build batch update requests
    const requests = Object.entries(variables).map(([key, value]) => ({
        replaceAllText: {
            containsText: {
                text: `{{${key}}}`,
                matchCase: false,
            },
            replaceText: value || '',
        },
    }));

    if (requests.length > 0) {
        await docs.documents.batchUpdate({
            documentId,
            requestBody: {
                requests,
            },
        });
    }
}

/**
 * Insert a table into a Google Doc
 */
export async function insertTableInDoc(
    documentId: string,
    rows: string[][],
    headerRow: string[],
    searchText: string = '{{products_table}}'
) {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth: auth as any });

    // First, get the document to find the location of the placeholder
    const doc = await docs.documents.get({ documentId });
    const content = doc.data.body?.content || [];

    let insertIndex = 1; // Default to start of document
    let placeholderFound = false;

    // Find the placeholder text
    for (const element of content) {
        if (element.paragraph) {
            for (const textElement of element.paragraph.elements || []) {
                if (textElement.textRun?.content?.includes(searchText)) {
                    insertIndex = element.endIndex! - 1;
                    placeholderFound = true;
                    break;
                }
            }
        }
        if (placeholderFound) break;
    }

    const requests: any[] = [];

    // If placeholder found, delete it first
    if (placeholderFound) {
        requests.push({
            deleteContentRange: {
                range: {
                    startIndex: insertIndex - searchText.length,
                    endIndex: insertIndex,
                },
            },
        });
        insertIndex -= searchText.length;
    }

    // Insert table
    const totalRows = rows.length + 1; // +1 for header
    const totalCols = headerRow.length;

    requests.push({
        insertTable: {
            rows: totalRows,
            columns: totalCols,
            location: {
                index: insertIndex,
            },
        },
    });

    // Execute the batch update
    const result = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
    });

    // Now populate the table with data
    const populateRequests: any[] = [];

    // Get updated document to find table location
    const updatedDoc = await docs.documents.get({ documentId });
    const tables = updatedDoc.data.body?.content?.filter(el => el.table) || [];

    if (tables.length > 0) {
        const table = tables[tables.length - 1].table; // Get the last inserted table

        // Populate header row
        headerRow.forEach((header, colIndex) => {
            const cell = table?.tableRows?.[0]?.tableCells?.[colIndex];
            if (cell?.content?.[0]?.startIndex) {
                populateRequests.push({
                    insertText: {
                        location: { index: cell.content[0].startIndex },
                        text: header,
                    },
                });
            }
        });

        // Populate data rows
        rows.forEach((row, rowIndex) => {
            row.forEach((cellData, colIndex) => {
                const cell = table?.tableRows?.[rowIndex + 1]?.tableCells?.[colIndex];
                if (cell?.content?.[0]?.startIndex) {
                    populateRequests.push({
                        insertText: {
                            location: { index: cell.content[0].startIndex },
                            text: cellData,
                        },
                    });
                }
            });
        });

        if (populateRequests.length > 0) {
            await docs.documents.batchUpdate({
                documentId,
                requestBody: { requests: populateRequests },
            });
        }
    }
}

/**
 * Export Google Doc as PDF
 */
export async function exportDocAsPDF(documentId: string): Promise<Buffer> {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth: auth as any });

    const response = await drive.files.export(
        {
            fileId: documentId,
            mimeType: 'application/pdf',
        },
        { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Export Google Doc as DOCX
 */
export async function exportDocAsDOCX(documentId: string): Promise<Buffer> {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth: auth as any });

    const response = await drive.files.export(
        {
            fileId: documentId,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Get shareable link for a Google Doc
 */
export async function getShareableLink(documentId: string): Promise<string> {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth: auth as any });

    // Make the file accessible to anyone with the link
    await drive.permissions.create({
        fileId: documentId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    const file = await drive.files.get({
        fileId: documentId,
        fields: 'webViewLink',
    });

    return file.data.webViewLink || '';
}
