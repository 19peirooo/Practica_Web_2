import app from "./app.js";
import dbConnect from './config/db.js'
import { env } from './config/env.js'
import { createServer } from 'node:http';
import mongoose from "mongoose";
import setupSocket from "./sockets/index.js";

const httpServer = createServer(app);
const io = setupSocket(httpServer)

app.set('io', io);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await dbConnect();
  const server = httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);

    server.close(async () => {
      console.log('🔌 Servidor HTTP cerrado');

      await mongoose.connection.close();
      console.log('🔌 Conexión a MongoDB cerrada');

      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forzando cierre');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

