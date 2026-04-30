import app from "./app.js";
import dbConnect from './config/db.js'
import { env } from './config/env.js'
import { Server } from "socket.io";
import { createServer } from 'node:http';

// const server = createServer(app)
// 
// export const io = new Server(server, {
//   cors: { origin: "*" },
// });

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await dbConnect();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}