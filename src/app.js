import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import helmet from 'helmet'
import { sanitizeBody, limitStringLength } from './middleware/sanitize.middleware.js';
import rateLimit from 'express-rate-limit'
import { errorHandler, notFound } from './middleware/error.middleware.js'
import mongoose from 'mongoose';
import morganBody from 'morgan-body'
import morgan from 'morgan'
import { loggerStream } from './utils/handleLogger.js'
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './docs/swagger.js';

const isProduction = process.env.NODE_ENV === 'production'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: true,
    message: 'Demasiadas peticiones, intenta en 15 minutos',
    code: 'RATE_LIMIT'
  },
  standardHeaders: true, // Headers RateLimit-*
  legacyHeaders: false   // Desactiva X-RateLimit-*
});

const app = express();

app.use(helmet())

// Middleware globales
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);
app.use(limitStringLength(5000));
if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

if (isProduction) {
  app.use(morgan('combined'))
} else {
  app.use(morgan('dev'))
}

if (process.env.NODE_ENV !== 'test') {
  morganBody(app, {
    noColors: true,
    skip: (req, res) => res.statusCode < 500,
    stream: loggerStream
  });
}

// Archivos estáticos
app.use('/uploads', express.static('uploads'));

// Rutas de la API
app.use('/api', routes);
if (process.env.NODE_ENV !== 'test') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
}

app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  };

  try {
    await mongoose.connection.db.admin().ping();
    healthcheck.db = 'connected';
  } catch (error) {
    healthcheck.status = 'error';
    healthcheck.db = 'disconnected';
    return res.status(503).json(healthcheck);
  }

  res.json(healthcheck);
});

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

export default app;
