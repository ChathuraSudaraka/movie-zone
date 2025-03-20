// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.6.3";
import Handlebars from "npm:handlebars@4.7.6";
import { corsHeaders } from "../_shared/cors.ts";

// Simplified transporter setup
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: Deno.env.get("ZOHO_USER"),
    pass: Deno.env.get("ZOHO_PASS")
  }
});

// Enhanced template fetching with multiple fallbacks
async function fetchTemplate(templateUrl) {
  try {
    const response = await fetch(templateUrl);
    if (!response.ok) throw new Error(`Failed to fetch template: ${response.statusText}`);
    return await response.text();
  } catch (error) {
    console.error("Template fetch error:", error);
    
    // Check which template we should return based on the URL
    if (templateUrl.includes("ConfirmEmailTemplate")) {
      return `<!DOCTYPE html><html><body>
        <h1>Email Verification</h1>
        <p>Hello {{name}},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
        <p><a href="{{verificationUrl}}">Verify Email Address</a></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </body></html>`;
    } else if (templateUrl.includes("ResetPasswordTemplate")) {
      return `<!DOCTYPE html><html><body>
        <h1>Password Reset</h1>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="{{resetUrl}}">Reset Password</a></p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </body></html>`;
    } else {
      // Default fallback for contact form or other templates
      return `<!DOCTYPE html><html><body>
        <h1>Message from {{name}}</h1>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Message:</strong></p>
        <p>{{message}}</p>
      </body></html>`;
    }
  }
}

// CORS headers for consistent use
const headers = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  
  try {
    // Parse and validate request
    const data = await req.json();
    
    if (!data.to || !data.subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to and subject" }),
        { status: 400, headers }
      );
    }
    
    // Prepare and send email
    const templateHtml = await fetchTemplate(data.template || 'https://yqggxjuqaplmklqpcwsx.supabase.co/storage/v1/object/public/email-template/ContactFormTemplate.html');
    const compiledHtml = Handlebars.compile(templateHtml)(data.data || {});
    
    // Determine the "from" address - can be customized by clients if needed
    const fromAddress = data.from || '"MovieZone" <chathurasudaraka@eversoft.lk>';
    
    const info = await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: data.subject,
      html: compiledHtml,
      // Support CC and BCC if provided
      ...(data.cc && { cc: data.cc }),
      ...(data.bcc && { bcc: data.bcc }),
    });
    
    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error sending email" }),
      { status: 500, headers }
    );
  }
});
