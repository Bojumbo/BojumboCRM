const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(process.cwd(), 'bojumbocrm-ed53600525ac.json');

async function checkStorage() {
    console.log('📊 Checking Service Account Storage Quota...');

    try {
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const res = await drive.about.get({
            fields: 'storageQuota,user'
        });

        const quota = res.data.storageQuota;
        const user = res.data.user;

        console.log('\n👤 Account Info:');
        console.log(`   Email: ${user.emailAddress}`);
        console.log(`   Name: ${user.displayName}`);

        console.log('\n💾 Storage Quota:');
        console.log(`   Limit:      ${formatBytes(quota.limit)}`);
        console.log(`   Used:       ${formatBytes(quota.usage)}`);
        console.log(`   Trash:      ${formatBytes(quota.usageInDriveTrash)}`);

        if (parseInt(quota.limit) > 0) {
            const percent = (parseInt(quota.usage) / parseInt(quota.limit)) * 100;
            console.log(`   Usage:      ${percent.toFixed(2)}%`);
        } else {
            console.log(`   Usage:      N/A (No limit or Unlimited)`);
        }

    } catch (error) {
        console.error('❌ Error checking quota:', error.message);
    }
}

function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

checkStorage();
