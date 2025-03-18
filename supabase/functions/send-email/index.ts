// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import nodemailer from "npm:nodemailer@6.6.3";
import Handlebars from "npm:handlebars@4.7.6";
import { corsHeaders } from "../_shared/cors.ts";

interface Request {
  to: string;
  subject: string;
  template: string; // URL to the template
  options: any; // Data to compile the template
}

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: Deno.env.get("ZOHO_USER"),
    pass: Deno.env.get("ZOHO_PASS"),
  },
});

// Function to fetch the HTML template from a URL
async function fetchTemplate(templateUrl: string): Promise<string> {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${response.statusText}`);
  }
  return await response.text();
}

Deno.serve(async (req: any) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data = (await req.json()) as Request;
    // Fetch the HTML template from the provided URL
    const templateHtml = await fetchTemplate(data.template);

    // Compile the template using Handlebars
    const template = Handlebars.compile(templateHtml);
    const compiledHtml = template(data.options);

    // Send the email with the compiled HTML
    const info = await transporter.sendMail({
      from: '"Everstock | POS System" <no-reply.everstock@eversoft.lk>', // sender address
      to: data.to, // list of receivers
      subject: data.subject, // Subject line
      html: compiledHtml, // Compiled HTML body
    });

    return new Response(
      JSON.stringify({
        info,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: error,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/mail-sender' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
