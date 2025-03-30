import { NextRequest, NextResponse } from 'next/server';
import * as SibApiV3Sdk from '@sendinblue/client';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const SENDINBLUE_API_KEY = process.env.SENDINBLUE_API_KEY || '';

if (SENDINBLUE_API_KEY) {
  apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, SENDINBLUE_API_KEY);
}

async function sendEmail(to: string, subject: string, text: string) {
  const emailData = {
    sender: { email: 'shahbaz@beingresonated.com', name: 'Being Resonated' },
    to: [{ email: to }],
    subject,
    textContent: text,
  };

  return apiInstance.sendTransacEmail(emailData);
}

export async function POST(req: NextRequest) {
  const { to, subject, text } = await req.json();

  if (!to || !subject || !text) {
    return NextResponse.json({ error: 'Missing required fields: to, subject, or text' }, { status: 400 });
  }

  try {
    const result = await sendEmail(to, subject, text);
    return NextResponse.json({ message: 'Email sent successfully!', result });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({
      error: 'Failed to send email',
      details: error.message || 'Unknown error occurred',
    }, { status: 500 });
  }
}