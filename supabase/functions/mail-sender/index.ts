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
    email?: string;
    message?: string;
    subject?: string;
    verificationUrl: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as EmailRequest;
    const { to, subject, template, data } = requestData;
    
    console.log('Received email request for:', { to, subject, name: data.name });

    // Fetch email template
    const templateResponse = await fetch(template);
    if (!templateResponse.ok) {
      throw new Error('Failed to fetch email template');
    }

    let templateHtml = await templateResponse.text();

    // Replace template variables
    templateHtml = templateHtml
      .replace(/\${name}/g, data.name)
      .replace(/\${email}/g, data.email || '')
      .replace(/\${message}/g, data.message || '')
      .replace(/\${subject}/g, data.subject || '')
      .replace(/\${confirmationUrl}/g, data.verificationUrl || '#')
      .replace(/\$\{new Date\(\)\.getFullYear\(\)\}/g, new Date().getFullYear().toString());

    // Log SMTP configuration (without password)
    console.log('SMTP Configuration:', {
      host: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT')),
      secure: Boolean(Deno.env.get('SMTP_SECURE') || 'true'),
      user: Deno.env.get('SMTP_USER'),
      from: Deno.env.get('SMTP_FROM')
    });

    // Configure SMTP transporter with more options
    const transporter = createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT')) || 465,
      secure: Boolean(Deno.env.get('SMTP_SECURE') || 'true'), // true for 465, false for other ports
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
        ciphers: 'SSLv3' // Try older cipher suite for compatibility
      },
      debug: true // Add debug output
    });

    // Test SMTP connection first
    try {
      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      throw new Error(`SMTP connection failed: ${verifyError.message}`);
    }

    // Use the SMTP_FROM environment variable - this should be configured in your Supabase Dashboard
    // Make sure this email address is allowed to send from your SMTP server
    const fromAddress = Deno.env.get('SMTP_FROM') || "no-reply@moviezone.com";

    const info = await transporter.sendMail({
      from: `"MovieZone Support" <${fromAddress}>`,
      to,
      subject,
      html: templateHtml,
      // Add reply-to header with the sender's email to allow direct replies
      replyTo: data.email || fromAddress
    });

    console.log('Email sent successfully:', info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        stack: error.stack,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
