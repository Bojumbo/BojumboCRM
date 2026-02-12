const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'bojumbocrm-ed53600525ac.json');

async function cleanupDrive() {
    console.log('🧹 Starting Google Drive Cleanup...');

    // Auth
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });
    const drive = google.drive({ version: 'v3', auth });

    // Step 1: Empty Trash
    console.log('🗑  Step 1: Emptying Trash...');
    try {
        await drive.files.emptyTrash();
        console.log('✅ Trash emptied.');
    } catch (e) {
        console.log('ℹ️  Trash might be already empty or failed:', e.message);
    }

    // Step 2: List and delete owned files
    console.log('\n🔍 Step 2: Listing files owned by Service Account...');
    const res = await drive.files.list({
        q: "'me' in owners and trashed = false",
        fields: 'files(id, name, mimeType, size, createdTime)',
        pageSize: 100,
    });

    const files = res.data.files;

    if (!files || files.length === 0) {
        console.log('✅ No files found owned by Service Account.');
    } else {
        console.log(`Found ${files.length} files.`);

        let deletedCount = 0;
        let freedBytes = 0;

        for (const file of files) {
            console.log(`Deleting: ${file.name} (ID: ${file.id}, Size: ${file.size || 0} bytes)...`);
            try {
                await drive.files.delete({ fileId: file.id });
                deletedCount++;
                freedBytes += parseInt(file.size || '0');
            } catch (error) {
                console.error(`Failed to delete ${file.name}:`, error.message);
            }
        }

        console.log(`\nDeleted ${deletedCount} files.`);
        console.log(`Freed approx ${(freedBytes / 1024 / 1024).toFixed(2)} MB.`);
    }

    console.log('\n🎉 Cleanup complete!');
}

cleanupDrive();
