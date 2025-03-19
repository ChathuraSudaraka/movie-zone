// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createTransport } from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  options: {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { to, subject, template, options } = await req.json() as EmailRequest;
    console.log('Received request:', { to, subject, options });

    // Fetch template
    const templateResponse = await fetch(template);
    if (!templateResponse.ok) {
      throw new Error('Failed to fetch email template');
    }

    let templateHtml = await templateResponse.text();

    // Replace template variables
    templateHtml = templateHtml
      .replace('${name}', options.name)
      .replace('${email}', options.email)
      .replace('${subject}', options.subject)
      .replace('${message}', options.message)
      .replace('${new Date().getFullYear()}', new Date().getFullYear().toString());

    const transporter = createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT')),
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
      // Add these options for better compatibility
      tls: {
        rejectUnauthorized: false
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5
    });

    // Verify connection before sending
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: Deno.env.get('SMTP_FROM'), // Use exact email from SMTP credentials
      to: to,
      replyTo: options.email, // Add reply-to for responses
      subject: subject,
      html: templateHtml,
      headers: {
        'X-MC-PreserveRecipients': 'false',
        'Precedence': 'Bulk'
      }
    });

    console.log('Email sent:', info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

/* To invoke locally:

  1. Run supabase start (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/mail-sender' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/