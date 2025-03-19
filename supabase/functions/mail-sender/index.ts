// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createTransport } from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log environment variables (excluding sensitive data)
    console.log('SMTP_HOST:', Deno.env.get('SMTP_HOST'));
    console.log('SMTP_PORT:', Deno.env.get('SMTP_PORT'));
    console.log('SMTP_FROM:', Deno.env.get('SMTP_FROM'));

    const { to, subject, data } = await req.json();
    console.log('Received request:', { to, subject, data: { ...data, verificationUrl: '(hidden)' } });

    // Validate required fields
    if (!to || !subject || !data?.name || !data?.verificationUrl) {
      throw new Error('Missing required fields: ' + 
        [
          !to && 'to',
          !subject && 'subject',
          !data?.name && 'name',
          !data?.verificationUrl && 'verificationUrl'
        ].filter(Boolean).join(', ')
      );
    }

    const transporter = createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT')),
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false // For development only
      }
    });

    // Test SMTP connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified');
    } catch (error) {
      console.error('SMTP verification failed:', error);
      throw new Error('Failed to connect to SMTP server: ' + error.message);
    }

    const info = await transporter.sendMail({
      from: `"MovieZone" <${Deno.env.get('SMTP_FROM')}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { 
                display: inline-block;
                padding: 12px 24px;
                background-color: #DC2626;
                color: white !important;
                text-decoration: none;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Welcome to MovieZone!</h2>
              <p>Hi ${data.name},</p>
              <p>Please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Email</a>
              </p>
              <p>Or copy and paste this link:</p>
              <p>${data.verificationUrl}</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', info.messageId);

    return new Response(
      JSON.stringify({ message: 'Email sent successfully', id: info.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to send email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
