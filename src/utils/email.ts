import { supabase } from '../config/supabase';

export async function sendEmail(params: {
  to: string;
  subject: string;
  template: 'confirm-email' | 'reset-password';
  data: Record<string, any>;
}) {
  try {
    const response = await supabase.functions.invoke('send-email', {
      body: params,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.error) {
      throw new Error(`Failed to send email: ${response.error.message}`);
    }

    return response.data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

// Utility functions for common email types
export const sendConfirmationEmail = async (email: string, name: string, token: string) => {
  return sendEmail({
    to: email,
    subject: 'Confirm your MovieZone account',
    template: 'confirm-email',
    data: {
      name,
      confirmationUrl: `${window.location.origin}/auth/verify?token=${token}`
    }
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string) => {
  return sendEmail({
    to: email,
    subject: 'Reset your MovieZone password',
    template: 'reset-password',
    data: {
      name,
      resetUrl: `${window.location.origin}/auth/reset-password?token=${token}`
    }
  });
};
