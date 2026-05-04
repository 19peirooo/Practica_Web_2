import clientHandler from "./handlers/client.handler.js";
import deliveryNoteHandler from "./handlers/deliverynote.handler.js";
import projectHandler from "./handlers/project.handler.js";
import {authMiddleware} from "./middleware/auth.middleware.js"
import { Server } from "socket.io";
import User from "../models/user.models.js"

export default function setupSocket(httpServer) {

  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.use(authMiddleware);

  io.on("connection",async (socket) => {
    const user = await User.findById(socket.user._id)

    socket.join(user.company.toString());

    console.log(`[SOCKET] Usuario ${socket.user._id} conectado a sala ${user.company}`);

    clientHandler(socket)
    projectHandler(socket)
    deliveryNoteHandler(socket)

    socket.on("disconnect", () => {
      console.log(`Usuario ${socket.user.id} desconectado`);
    });
    
  });

  return io
}