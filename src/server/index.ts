import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { sendContactEmail } from './emailService';

dotenv.config();

const server = fastify({
    logger: true,
    ignoreTrailingSlash: true
});

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://movie-zone.pages.dev'
];

// CORS configuration
await server.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error('Not allowed'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  preflight: true
});

// Default route
server.get('/', async (_request, reply) => {
    return reply.send({ status: 'ok', message: 'Server is running' });
});

// Health check route
server.get('/health', async (_request, reply) => {
    return reply.send({ status: 'ok' });
});

// Contact route
server.post('/api/contact', {
    schema: {
        body: {
            type: 'object',
            required: ['name', 'email', 'subject', 'message'],
            properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                subject: { type: 'string' },
                message: { type: 'string' }
            }
        }
    }
}, async (request, reply) => {
    try {
        const { name, email, subject, message } = request.body as any;
        await sendContactEmail({ name, email, subject, message });

        return reply
            .code(200)
            .header('Access-Control-Allow-Origin', request.headers.origin || ALLOWED_ORIGINS[0])
            .header('Access-Control-Allow-Credentials', 'true')
            .send({ success: true });
    } catch (error) {
        request.log.error(error);
        return reply
            .code(500)
            .header('Access-Control-Allow-Origin', request.headers.origin || ALLOWED_ORIGINS[0])
            .header('Access-Control-Allow-Credentials', 'true')
            .send({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send email'
            });
    }
});

// Error handler
server.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply
        .code(error.statusCode || 500)
        .header('Access-Control-Allow-Origin', 'http://localhost:5173')
        .header('Access-Control-Allow-Credentials', 'true')
        .send({
            success: false,
            error: error.message || 'Internal Server Error'
        });
});

// Not found handler
server.setNotFoundHandler((_request, reply) => {
    reply
        .code(404)
        .header('Access-Control-Allow-Origin', 'http://localhost:5173')
        .header('Access-Control-Allow-Credentials', 'true')
        .send({
            success: false,
            error: 'Route not found'
        });
});

const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running at http://localhost:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
