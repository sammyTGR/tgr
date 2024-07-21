import type { NextApiRequest, NextApiResponse } from 'next';
import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'POST') {
    const { email, subject, message } = req.body;

    console.log('Request Body:', req.body);

    if (!email || !subject || !message) {
      res.status(400).json({ error: 'Missing required fields', details: req.body });
      return;
    }

    try {
      const msg = {
        to: email,
        from: 'samlee@thegunrange.biz', // Your verified sender
        subject: subject,
        text: message,
        html: `<strong>${message}</strong>`, // Optional: Include HTML content
      };

      await sendgrid.send(msg);
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error: any) {
      console.error('Error sending email:', error.response?.body || error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
