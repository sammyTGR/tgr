import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY as string);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'POST') {
    const { email, subject, message } = req.body;

    // Log the request body to debug the issue
    console.log('Request Body:', req.body);

    if (!email || !subject || !message) {
      res.status(400).json({ error: 'Missing required fields', details: req.body });
      return;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_VERIFIED_SENDER_EMAIL as string,
        to: [email],
        subject: subject,
        html: `<p>${message}</p>`,
      });

      if (error) {
        return res.status(400).json(error);
      }

      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
