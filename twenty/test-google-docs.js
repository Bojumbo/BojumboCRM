/**
 * Test Google Docs Integration
 * Run: node test-google-docs.js YOUR_GOOGLE_DOC_ID
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive',
];

const CREDENTIALS_PATH = path.join(process.cwd(), 'bojumbocrm-ed53600525ac.json');

async function testGoogleDocsAccess(templateId) {
    console.log('🔍 Testing Google Docs Integration...\n');

    // Step 1: Check credentials file
    console.log('Step 1: Checking credentials file...');
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ ERROR: Credentials file not found at:', CREDENTIALS_PATH);
        console.log('Please make sure bojumbocrm-ed53600525ac.json exists in the project root.');
        process.exit(1);
    }
    console.log('✅ Credentials file found\n');

    // Step 2: Load credentials
    console.log('Step 2: Loading credentials...');
    let credentials;
    try {
        credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
        console.log('✅ Credentials loaded');
        console.log(`   Service Account Email: ${credentials.client_email}\n`);
    } catch (error) {
        console.error('❌ ERROR: Failed to parse credentials file:', error.message);
        process.exit(1);
    }

    // Step 3: Authenticate
    console.log('Step 3: Authenticating with Google...');
    let auth;
    try {
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
        const client = await auth.getClient();
        console.log('✅ Authentication successful\n');
    } catch (error) {
        console.error('❌ ERROR: Authentication failed:', error.message);
        process.exit(1);
    }

    // Step 4: Test Drive API access
    console.log('Step 4: Testing Drive API access...');
    const drive = google.drive({ version: 'v3', auth });

    try {
        const fileInfo = await drive.files.get({
            fileId: templateId,
            fields: 'id,name,mimeType,owners,permissions',
        });

        console.log('✅ Template found!');
        console.log(`   Name: ${fileInfo.data.name}`);
        console.log(`   Type: ${fileInfo.data.mimeType}`);
        console.log(`   ID: ${fileInfo.data.id}\n`);

        // Check permissions
        console.log('Step 5: Checking permissions...');
        const permissions = fileInfo.data.permissions || [];
        const serviceAccountHasAccess = permissions.some(
            (p) => p.emailAddress === credentials.client_email
        );

        if (serviceAccountHasAccess) {
            console.log('✅ Service Account has access to this document\n');
        } else {
            console.log('⚠️  WARNING: Service Account may not have explicit access');
            console.log(`   Please share the document with: ${credentials.client_email}`);
            console.log('   And grant "Editor" permissions\n');
        }

        // Step 6: Test copying
        console.log('Step 6: Testing document copy...');

        let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        console.log(`   Destination Folder ID: ${folderId || 'None (Using Service Account Drive)'}`);

        const requestBody = {
            name: `TEST_COPY_${Date.now()}`,
        };

        if (folderId) {
            requestBody.parents = [folderId];
        }

        const copyResponse = await drive.files.copy({
            fileId: templateId,
            requestBody,
        });
        console.log('✅ Successfully created a copy of the template');
        console.log(`   New document ID: ${copyResponse.data.id}`);
        console.log(`   Link: https://docs.google.com/document/d/${copyResponse.data.id}/edit\n`);

        // Clean up - delete the test copy
        console.log('Cleaning up test copy...');
        await drive.files.delete({ fileId: copyResponse.data.id });
        console.log('✅ Test copy deleted\n');

        console.log('🎉 All tests passed! Your Google Docs integration is working correctly.\n');
        console.log('You can now use this template in your CRM.');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);

        if (error.code === 404) {
            console.log('\n📌 Troubleshooting:');
            console.log('1. Verify the Google Doc ID is correct');
            console.log('2. Make sure the document exists');
            console.log('3. Check that you\'re using the ID from the URL, not the title');
            console.log(`   URL format: docs.google.com/document/d/[THIS_IS_THE_ID]/edit`);
        } else if (error.code === 403) {
            console.log('\n📌 Troubleshooting:');
            console.log('1. Open your Google Doc');
            console.log('2. Click "Share" button');
            console.log(`3. Add this email: ${credentials.client_email}`);
            console.log('4. Grant "Editor" permissions');
            console.log('5. Click "Done" and try again');
        }

        process.exit(1);
    }
}

// Get template ID from command line
const templateId = process.argv[2];

if (!templateId) {
    console.log('Usage: node test-google-docs.js YOUR_GOOGLE_DOC_ID');
    console.log('\nExample:');
    console.log('  node test-google-docs.js 1ABC-xyz123_EXAMPLE_ID');
    console.log('\nGet the ID from your Google Docs URL:');
    console.log('  https://docs.google.com/document/d/[THIS_PART_IS_THE_ID]/edit');
    process.exit(1);
}

testGoogleDocsAccess(templateId);
