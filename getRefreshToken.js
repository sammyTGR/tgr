const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize this app by visiting this url:', authUrl);
rl.question('Enter the code from that page here: ', async (code) => {
  try {
    console.log("Authorization code received:", code);
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('Refresh Token:', tokens.refresh_token);
    rl.close();
  } catch (error) {
    //console.('Error retrieving access token', error);
  }
});
