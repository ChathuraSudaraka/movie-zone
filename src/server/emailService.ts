import nodemailer from 'nodemailer';

// Create reusable transporter with better error handling
const createTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false, // Use TLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            // Allow self-signed certificates
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        debug: true, // Enable debug logs
        logger: true
    };

    console.log('Creating mail transporter with config:', {
        ...config,
        auth: { ...config.auth, pass: '***' } // Hide password in logs
    });

    return nodemailer.createTransport(config);
};

interface EmailData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function sendContactEmail(data: EmailData) {
    console.log('Attempting to send email with data:', {
        ...data,
        message: data.message.substring(0, 50) + '...' // Truncate for logging
    });

    const { name, email, subject, message } = data;
    const transporter = createTransporter();

    try {
        // Verify connection configuration
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        const mailOptions = {
            from: {
                name: process.env.SMTP_FROM_NAME || 'MovieZone',
                address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com'
            },
            to: process.env.CONTACT_FORM_TO_EMAIL,
            replyTo: email,
            subject: `Contact Form: ${subject}`,
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `.trim(),
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #e50914; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .field { margin-bottom: 15px; }
              .field strong { color: #444; }
              .message { white-space: pre-wrap; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Contact Form Message</h1>
              </div>
              <div class="content">
                <div class="field">
                  <strong>From:</strong> ${name} (${email})
                </div>
                <div class="field">
                  <strong>Subject:</strong> ${subject}
                </div>
                <div class="field">
                  <strong>Message:</strong>
                  <div class="message">${message.replace(/\n/g, '<br>')}</div>
                </div>
              </div>
              <div class="footer">
                <p>Sent from MovieZone Contact Form</p>
              </div>
            </div>
          </body>
        </html>
      `
        };

        console.log('Sending email with options:', {
            ...mailOptions,
            html: '[HTML Content]' // Don't log full HTML
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error: any) {
        console.error('Email send error:', {
            code: error.code,
            message: error.message,
            command: error.command
        });
        throw new Error(
            `Failed to send email: ${error.message || 'Unknown error'}`
        );
    }
}
