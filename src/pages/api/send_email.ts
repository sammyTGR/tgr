import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'POST') {
    const { email, subject, message, oauthToken } = req.body;

    // Log the request body to debug the issue
    console.log('Request Body:', req.body);

    if (!email || !subject || !message || !oauthToken) {
      res.status(400).json({ error: 'Missing required fields', details: req.body });
      return;
    }

    try {
      // Initialize the OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({ access_token: oauthToken });

      // Initialize the Gmail API client
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Create the email message
      const rawMessage = createEmail(email, subject, message);

      // Send the email
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage,
        },
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function createEmail(to: string, subject: string, message: string) {
  const email = [
    `To: ${to}`,
    'Subject: ' + subject,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    message,
  ].join('\n');

  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}
