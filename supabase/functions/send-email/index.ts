// Add Deno namespace reference
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import Handlebars from "npm:handlebars@4.7.8";

interface EmailRequest {
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

const templates = {
  'confirm-email': `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* ... existing email template styles ... */
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">MovieZone</div>
          <div class="title">Confirm your email address</div>
          <div class="text">
            Hi {{name}},<br><br>
            Thanks for signing up for MovieZone! Please confirm your email address by clicking the button below.
          </div>
          <a href="{{confirmationUrl}}" class="button">Confirm Email Address</a>
          <div class="text" style="margin-top: 24px;">
            If you didn't create an account with MovieZone, you can safely ignore this email.
          </div>
          <div class="footer">
            © {{year}} MovieZone. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  'reset-password': `...`, // Add reset password template
  'welcome': `...` // Add welcome template
};

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { to, subject, templateName, data } = await req.json();

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST")!,
        port: Number(Deno.env.get("SMTP_PORT")),
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER")!,
          password: Deno.env.get("SMTP_PASS")!,
        }
      }
    });

    const templateHtml = templates[templateName];
    if (!templateHtml) {
      throw new Error(`Template ${templateName} not found`);
    }

    const templateData = {
      ...data,
      year: new Date().getFullYear()
    };

    const template = Handlebars.compile(templateHtml);
    const html = template(templateData);

    await client.send({
      from: Deno.env.get("SMTP_FROM_EMAIL")!,
      to,
      subject,
      content: "text/html",
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
