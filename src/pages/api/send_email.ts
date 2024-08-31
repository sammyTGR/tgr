import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { corsHeaders } from '@/utils/cors';
import TimeOffApproved from './../../../emails/TimeOffApproved';
import TimeOffDenied from './../../../emails/TimeOffDenied';
import CalledOut from './../../../emails/CalledOut';
import LeftEarly from './../../../emails/LeftEarly';
import CustomStatus from './../../../emails/CustomStatus'; // Import the new CustomStatus template

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'POST') {
    const { email, subject, templateName, templateData } = req.body;

    console.log('Received data:', { email, subject, templateName, templateData });

    if (!email || !subject || !templateName) {
      console.log('Missing fields:', { email, subject, templateName });
      res.status(400).json({ error: 'Missing required fields', details: req.body });
      return;
    }

    try {
      let emailTemplate;
      switch (templateName) {
        case 'TimeOffApproved':
          emailTemplate = TimeOffApproved(templateData);
          break;
        case 'TimeOffDenied':
          emailTemplate = TimeOffDenied(templateData);
          break;
        case 'CalledOut':
          emailTemplate = CalledOut(templateData);
          break;
        case 'LeftEarly':
          emailTemplate = LeftEarly(templateData);
          break;
        case 'CustomStatus':
          emailTemplate = CustomStatus({
            name: templateData.name,
            date: templateData.date,
            status: templateData.status || templateData.customMessage // Use status or customMessage, whichever is provided
          });
          break;
        default:
          throw new Error('Invalid template name');
      }

      const resendRes = await resend.emails.send({
        from: `TGR <scheduling@${process.env.RESEND_DOMAIN}>`,
        to: [email],
        subject: subject,
        react: emailTemplate,
      });

      console.log('Resend response:', resendRes);

      if (resendRes.error) {
        throw new Error(resendRes.error.message);
      }

      res.status(200).json({ message: 'Email sent successfully', data: resendRes });
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
