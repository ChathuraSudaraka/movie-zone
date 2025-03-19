import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createTransport } from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      throw new Error('Missing required fields')
    }

    // Get the template content
    const templateUrl = 'https://yqggxjuqaplmklqpcwsx.supabase.co/storage/v1/object/public/email-template/ContactFormTemplate.html';
    const templateResponse = await fetch(templateUrl);
    let template = await templateResponse.text();

    // Replace template variables
    template = template
      .replace('${name}', name)
      .replace('${email}', email)
      .replace('${subject}', subject)
      .replace('${message}', message)
      .replace('${new Date().getFullYear()}', new Date().getFullYear().toString());

    const transporter = createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT')),
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    await transporter.verify()

    const info = await transporter.sendMail({
      from: `"MovieZone Contact" <${Deno.env.get('SMTP_FROM')}>`,
      to: Deno.env.get('ADMIN_EMAIL'),
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: template
    })

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
