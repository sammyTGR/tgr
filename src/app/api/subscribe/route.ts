import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email, first_name, last_name } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const MailchimpKey = process.env.MAILCHIMP_API_KEY;
    const MailchimpServer = process.env.MAILCHIMP_API_SERVER;
    const MailchimpAudience = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!MailchimpKey || !MailchimpServer || !MailchimpAudience) {
      throw new Error('Missing Mailchimp environment variables');
    }

    // Create MD5 hash of lowercase email for Mailchimp subscriber ID
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    const baseUrl = `https://${MailchimpServer}.api.mailchimp.com/3.0/lists/${MailchimpAudience}/members`;
    const memberUrl = `${baseUrl}/${subscriberHash}`;

    const memberData = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: first_name || '',
        LNAME: last_name || ''
      }
    };

    // First try to update the existing member
    const response = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MailchimpKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mailchimp error:', errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to subscribe' },
        { status: response.status }
      );
    }

    const received = await response.json();
    return NextResponse.json({
      ...received,
      message: 'Successfully updated subscription'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}