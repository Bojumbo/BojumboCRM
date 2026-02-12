'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDocumentTemplates() {
    try {
        return await prisma.documentTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
}

export async function getTemplateById(id: string) {
    try {
        return await prisma.documentTemplate.findUnique({
            where: { id }
        });
    } catch (error) {
        console.error('Error fetching template:', error);
        return null;
    }
}

export async function createTemplate(name: string, googleDocId: string, googleDriveFolderId?: string) {
    try {
        const template = await prisma.documentTemplate.create({
            data: { name, googleDocId, googleDriveFolderId }
        });
        revalidatePath('/admin/templates');
        return { success: true, data: template };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateTemplate(id: string, data: { name?: string, googleDocId?: string, googleDriveFolderId?: string }) {
    try {
        const template = await prisma.documentTemplate.update({
            where: { id },
            data
        });
        revalidatePath('/admin/templates');
        revalidatePath(`/admin/templates/${id}/edit`);
        return { success: true, data: template };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteTemplate(id: string) {
    try {
        await prisma.documentTemplate.delete({ where: { id } });
        revalidatePath('/admin/templates');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function generateTemplateDocx(templateId: string, dealId: string) {
    try {
        const { copyTemplate, replaceVariablesInDoc, insertTableInDoc, exportDocAsDOCX, getShareableLink } = await import('@/lib/google-docs');

        // Fetch template and deal
        const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
        if (!template) throw new Error('Template not found');

        const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            include: {
                counterparty: true,
                products: { include: { product: true } }
            }
        });
        if (!deal) throw new Error('Deal not found');

        // Generate file name
        const docNum = (deal as any).documentNumber || 'PENDING';
        const cleanTemplateName = template.name.replace(/[^a-z0-9]/gi, '_');
        const cleanDocNum = docNum.replace(/[^a-z0-9]/gi, '_');
        const fileName = `${cleanTemplateName}_№_${cleanDocNum}`;

        // Create a copy of the template
        console.log('Creating copy of Google Docs template:', template.googleDocId);

        // Fetch global folder ID from settings
        const globalFolderId = await prisma.systemSetting.findUnique({
            where: { key: 'GOOGLE_DRIVE_FOLDER_ID' }
        });

        // Determine destination folder: template specific or global setting or env fallback
        // Cast template to any because Typescript might be stale about the new column
        const destinationFolderId = (template as any).googleDriveFolderId || globalFolderId?.value || process.env.GOOGLE_DRIVE_FOLDER_ID;

        const newDocId = await copyTemplate(
            template.googleDocId,
            fileName,
            destinationFolderId
        );
        if (!newDocId) throw new Error('Failed to create document copy');

        // Prepare variables for replacement
        const variables: Record<string, string> = {
            title: deal.title || 'Untitled',
            doc_number: (deal as any).documentNumber || 'PENDING',
            amount: `$${Number(deal.amount || 0).toLocaleString()}`,
            cp_name: deal.counterparty?.name || 'N/A',
            date: new Date().toLocaleDateString(),
        };

        // Replace all variables in the document
        console.log('Replacing variables in document...');
        await replaceVariablesInDoc(newDocId, variables);

        // Insert products table if products exist
        if ((deal as any).products && (deal as any).products.length > 0) {
            console.log('Inserting products table...');
            const headerRow = ['Item', 'Qty', 'Price', 'Total'];
            const rows = (deal as any).products.map((p: any) => [
                p.product?.name || 'Unknown Item',
                p.quantity.toString(),
                `$${Number(p.priceAtSale).toLocaleString()}`,
                `$${(Number(p.priceAtSale) * p.quantity).toLocaleString()}`
            ]);

            await insertTableInDoc(newDocId, rows, headerRow, '{{products_table}}');
        }

        // Get shareable link
        const viewLink = await getShareableLink(newDocId);

        // Export as DOCX
        console.log('Exporting document as DOCX...');
        const docxBuffer = await exportDocAsDOCX(newDocId);
        const base64Content = docxBuffer.toString('base64');

        return {
            success: true,
            data: base64Content,
            filename: `${fileName}.docx`,
            googleDocId: newDocId,
            viewLink,
        };
    } catch (error) {
        console.error('Google Docs generation error:', error);
        return {
            success: false,
            error: (error as Error).message || 'Failed to generate document'
        };
    }
}

export async function saveGeneratedDocument(
    dealId: string,
    name: string,
    contentBase64: string,
    templateId?: string,
    googleDocId?: string,
    viewLink?: string
) {
    try {
        const doc = await prisma.generatedDocument.create({
            data: {
                dealId,
                name,
                content: contentBase64,
                templateId,
                googleDocId,
                viewLink,
            }
        });
        revalidatePath(`/deals`);
        return { success: true, data: doc };
    } catch (error) {
        console.error('Error saving document:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getDealDocuments(dealId: string) {
    try {
        return await prisma.generatedDocument.findMany({
            where: { dealId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Error fetching deal documents:', error);
        return [];
    }
}

export async function deleteGeneratedDocument(id: string) {
    try {
        await prisma.generatedDocument.delete({ where: { id } });
        revalidatePath('/deals');
        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: (error as Error).message };
    }
}

