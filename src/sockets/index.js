import {authMiddleware} from "./middleware/auth.middleware.js"

export default function initSockets(io) {
  io.use(authMiddleware);

  io.on("connection", (socket) => {
    const companyId = socket.user.company;

    socket.join(companyId);

    console.log(`[SOCKET] Usuario ${socket.user.id} conectado a sala ${companyId}`);

    socket.on("disconnect", () => {
      console.log(`Usuario ${socket.user.id} desconectado`);
    });

    socket.on("client:new", (data) => {
      console.log("Nuevo Cliente:", data.name);
    });

    socket.on("project:new", (data) => {
      console.log("Nuevo Proyecto:", data.name);
    });

    socket.on("deliverynote:new", (data) => {
      console.log("Nuevo Albarán:", data.description);
    });

    socket.on("deliverynote:signed", (data) => {
      console.log("Albarán firmado:", data.description);
    });
  });
}