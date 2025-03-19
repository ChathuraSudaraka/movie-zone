// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://deno.land/x/webidl/lib.deno_webidl.d.ts" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createTransport } from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  data: {
    name: string;
    verificationUrl: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Log environment variables (excluding sensitive data)
    console.log('SMTP_HOST:', Deno.env.get('SMTP_HOST'));
    console.log('SMTP_PORT:', Deno.env.get('SMTP_PORT'));
    console.log('SMTP_FROM:', Deno.env.get('SMTP_FROM'));

    const { to, subject, template, data } = await req.json() as EmailRequest;
    console.log('Received verification request for:', { to, name: data.name });

    // Fetch email template
    const templateResponse = await fetch(template);
    if (!templateResponse.ok) {
      throw new Error('Failed to fetch email template');
    }

    let templateHtml = await templateResponse.text();

    // Replace template variables
    templateHtml = templateHtml
      .replace('${name}', data.name)
      .replace('${confirmationUrl}', data.verificationUrl)
      .replace(/\$\{new Date\(\)\.getFullYear\(\)\}/g, new Date().getFullYear().toString());

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
      html: templateHtml
    });

    console.log('Verification email sent:', info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
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
