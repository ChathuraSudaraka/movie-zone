import { supabase } from '../config/supabase';

interface SendEmailParams {
  to: string;
  subject: string;
  templateName: 'confirm-email' | 'reset-password' | 'welcome';
  data: {
    name?: string;
    confirmationUrl?: string;
    resetUrl?: string;
    [key: string]: any;
  };
}

export async function sendEmail({ to, subject, templateName, data }: SendEmailParams) {
  try {
    const { data: functionData, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        templateName,
        data: {
          ...data,
          year: new Date().getFullYear()
        }
      }
    });

    if (error) {
      console.error('Email function error:', error);
      throw error;
    }

    return functionData;
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw error to prevent blocking registration
    return null;
  }
}
