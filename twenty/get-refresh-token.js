const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

const SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive', // Full drive access
];

async function getRefreshToken() {
    let content;
    try {
        content = fs.readFileSync(CREDENTIALS_PATH);
    } catch (err) {
        console.error('\n❌ ERROR: "credentials.json" not found.');
        console.error('   Please create OAuth 2.0 Client ID in Google Cloud Console, download the JSON, and save it as "credentials.json" in this folder.');
        console.error('   See OAUTH_SETUP.md for detailed instructions.\n');
        return;
    }

    const keys = JSON.parse(content);
    // Find client_id and client_secret
    const key = keys.installed || keys.web;
    if (!key) {
        console.error('\n❌ ERROR: Invalid credentials.json format. Make sure you downloaded the client_secret JSON for Desktop application.');
        return;
    }

    const { client_secret, client_id, redirect_uris } = key;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // IMPORTANT: This ensures we get a refresh token
        scope: SCOPES,
        prompt: 'consent', // Ensures we get a refresh token even if user previously authorized
    });

    console.log('\n🔐 Authorize this app by visiting this url:\n');
    console.log(authUrl);
    console.log('\n👉 Copy the code from that page and paste it here:');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error retrieving access token', err);
                return;
            }
            oAuth2Client.setCredentials(token);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log('\n✅ Token stored to', TOKEN_PATH);
            console.log('You can now use your Google Drive!');
        });
    });
}

getRefreshToken();
