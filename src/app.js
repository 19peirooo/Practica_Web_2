import express from 'express'
import cors from 'cors'
import dbConnect from './config/db.js'
import routes from './routes/index.js'
import helmet from 'helmet'
import { sanitizeBody, limitStringLength } from './middleware/sanitize.middleware.js';
import rateLimit from 'express-rate-limit'
import { errorHandler, notFound } from './middleware/error.middleware.js'
import morganBody from 'morgan-body'
import morgan from 'morgan'
import { loggerStream } from './utils/handleLogger.js'
import { env } from './config/env.js'
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
app.use(limiter)

if (isProduction) {
  app.use(morgan('combined'))
} else {
  app.use(morgan('dev'))
}

morganBody(app, {
  noColors: true,
  skip: (req, res) => res.statusCode < 400, // Solo errores
  stream: loggerStream
});

// Archivos estáticos
app.use('/uploads', express.static('uploads'));

// Rutas de la API
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await dbConnect();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
};

startServer();

