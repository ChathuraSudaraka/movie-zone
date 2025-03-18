import { FastifyInstance } from 'fastify';
import { sendContactEmail } from '../emailService';

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/contact', async (request, reply) => {
    try {
      const { name, email, subject, message } = request.body as any;

      // Validate inputs
      if (!name || !email || !subject || !message) {
        return reply.status(400).send({
          success: false,
          error: 'All fields are required'
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Send email
      await sendContactEmail({ name, email, subject, message });

      return reply.status(200).send({
        success: true,
        message: 'Email sent successfully'
      });
    } catch (error: any) {
      console.error('Contact API error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send email'
      });
    }
  });
}
