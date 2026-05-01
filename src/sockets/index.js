import clientHandler from "./handlers/client.handler.js";
import deliveryNoteHandler from "./handlers/deliverynote.handler.js";
import projectHandler from "./handlers/project.handler.js";
import {authMiddleware} from "./middleware/auth.middleware.js"
import { Server } from "socket.io";

export default function setupSocket(httpServer) {

  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    const companyId = socket.user.company;

    socket.join(companyId);

    console.log(`[SOCKET] Usuario ${socket.user.id} conectado a sala ${companyId}`);

    clientHandler(socket)
    projectHandler(socket)
    deliveryNoteHandler(socket)

    socket.on("disconnect", () => {
      console.log(`Usuario ${socket.user.id} desconectado`);
    });
    
  });

  return io
}